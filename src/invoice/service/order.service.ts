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
import { RandomSevenDigits } from 'src/core/common';

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

    for (const createInvoice of invoicePayloadDto) {
      const validateProduct = await this.productRepo.findOne({
        where: { id: createInvoice.productId },
      });

      if (!validateProduct) {
        throw new BadRequestException('Product not found');
      }

      const productTotal = validateProduct.price * createInvoice.quantity;
      totalAmount += productTotal;
      const invoice = await this.invoiceService.createInvoice(
        createInvoice,
        validateUser.id,
      );
      invoices.push(invoice);
    }

    order.invoices = invoices;
    order.total_price = totalAmount;

    const savedOrder = await this.orderRepo.save(order);

    const paymentResponse = await this.createPaymentRequest(
      validateUser.email,
      totalAmount,
      validateUser.first_name + ' ' + validateUser.last_name,
      validateUser.phone,
    );

    if (!paymentResponse || paymentResponse.status !== 'success') {
      throw new BadRequestException('Failed to create payment request');
    }

    let orderId = RandomSevenDigits();
    const validateOrder = await this.orderRepo.findOne({
      where: { order_id: orderId },
    });

    do {
      orderId = RandomSevenDigits();
    } while (validateOrder);

    savedOrder.status = 'awaiting_payment';
    savedOrder.updated_at = new Date();
    savedOrder.reference =
      paymentResponse.meta.authorization.transfer_reference;
    savedOrder.payment_details = paymentResponse.meta.authorization;
    savedOrder.order_id = orderId;

    await this.orderRepo.save(savedOrder);

    return savedOrder;
  }

  async getOrdersByUserAndStatus(
    userId: string,
    status?: string,
  ): Promise<Order[]> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .where('user.id = :userId', { userId });

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query.getMany();
  }

  async getOrdersByProductOwnerAndStatus(
    userId: string,
    status?: string,
  ): Promise<Order[]> {
    const conditions: any = { product_owner: { id: userId } };
    if (status) {
      conditions['status'] = status;
    }

    return this.orderRepo.find({
      where: conditions,
      relations: ['product_owner', 'user'],
      select: {
        product_owner: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
          email: true,
        },
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
          email: true,
        },
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getOrdersByAndStatus(
    userId: string,
    status?: string,
  ): Promise<Order[]> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .where('user.id = :userId', { userId });

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query.getMany();
  }

  async getAllOrdersByUser(userId: string): Promise<Order[]> {
    return await this.orderRepo.find({ where: { user: { id: userId } } });
  }

  async getOrderByIdAndUser(
    orderId: string,
    userId: string,
  ): Promise<Order | null> {
    return await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });
  }

  private async createPaymentRequest(
    email: string,
    amount: number,
    fullname: string,
    phone_number: string,
  ): Promise<any> {
    console.log('this is getting here three');
    const data = {
      amount,
      email,
      currency: 'NGN',
      tx_ref: `order_${Date.now()}`,
      fullname,
      phone_number,
      // client_ip: '154.123.220.1',
      // device_fingerprint: '62wd23423rq324323qew1',
      meta: {
        sideNote: 'This is a side note to track this payment request',
      },
      is_permanent: false, // Set to true for a static account number
    };

    const options = {
      method: 'POST',
      url: 'https://api.flutterwave.com/v3/charges?type=bank_transfer',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      data,
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(
          'Error creating payment request',
          error.response.data.message || error.message,
        );
      } else if (error.request) {
        throw new BadRequestException('No response received from payment API');
      } else {
        throw new BadRequestException(
          'Error creating payment request',
          error.message,
        );
      }
    }
  }
}
