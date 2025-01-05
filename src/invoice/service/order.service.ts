import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceService } from './invoice.service';
import { InvoicePayloadDto, OrderPayloadDto } from '../dto/create-invoice.dto';
import { Order } from '../entities/order.entity';
import { Invoice } from '../entities/invoice.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import axios from 'axios';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly invoiceService: InvoiceService,
  ) {}

  async create(
    invoicePayloadDto: InvoicePayloadDto[],
    orderPayload: OrderPayloadDto,
    productOwner: string,
  ) {
    // Validate user
    const validateUser = await this.userRepo.findOne({
      where: { id: orderPayload.user },
    });

    if (!validateUser) {
      throw new BadRequestException('User not found');
    }

    const order = this.orderRepo.create({
      product_owner: { id: productOwner } as any,
      user: { id: orderPayload.user } as any,
      zip_code: orderPayload.zip_code,
      billing_address: orderPayload.billing_address,
      city: orderPayload.city,
    });
    const invoices: Invoice[] = [];
    let totalAmount = 0;

    // Iterate over the array of invoice objects
    for (const createInvoice of invoicePayloadDto) {
      const validateProduct = await this.productRepo.findOne({
        where: { id: createInvoice.productId },
      });

      if (!validateProduct) {
        throw new BadRequestException('Product not found');
      }

      // Calculate total price
      const productTotal = validateProduct.price * createInvoice.quantity;
      totalAmount += productTotal;
      const invoice = await this.invoiceService.createInvoice(createInvoice);
      invoices.push(invoice);
    }

    // Associate the invoices with the order
    order.invoices = invoices;
    order.total_price = totalAmount;

    // Save the order along with the associated invoices
    const savedOrder = await this.orderRepo.save(order);

    // Generate virtual account
    const virtualAccountResponse = await this.createVirtualAccount(
      validateUser.email,
      totalAmount,
    );

    if (!virtualAccountResponse || !virtualAccountResponse.data) {
      throw new BadRequestException('Failed to create virtual account');
    }

    // Update order with virtual account details
    savedOrder.status = 'awaiting_payment';
    savedOrder.updated_at = new Date();
    savedOrder.reference = virtualAccountResponse.data.order_ref;
    savedOrder.virtualAccountDetails = virtualAccountResponse.data;

    await this.orderRepo.save(savedOrder);

    return savedOrder;
  }

  async getAllOrdersByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({ where: { user: { id: userId } } });
  }

  async getOrderByIdAndUser(
    orderId: string,
    userId: string,
  ): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });
  }

  private async createVirtualAccount(
    email: string,
    amount: number,
  ): Promise<any> {
    const data = {
      email,
      amount,
      currency: 'NGN',
      tx_ref: `order_${Date.now()}`,
      is_permanent: false, // Set to true for a static account number
    };

    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/virtual-account-numbers',
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(
          'Error creating virtual account',
          error.response.data.message || error.message,
        );
      } else if (error.request) {
        throw new BadRequestException('No response received from Flutterwave');
      } else {
        throw new BadRequestException(
          'Error creating virtual account',
          error.message,
        );
      }
    }
  }
}
