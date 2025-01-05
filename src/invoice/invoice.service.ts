import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import axios from 'axios';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createInvoice(
    payload: CreateInvoiceDto,
    productOwner: string,
  ): Promise<Invoice> {
    const { product, user, quantity, ...rest } = payload;
    const validateProduct = await this.productRepo.findOne({
      where: { id: product },
    });
    if (!validateProduct) {
      throw new BadRequestException('Product not found');
    }

    const validateUser = await this.userRepo.findOne({ where: { id: user } });
    if (!validateUser) {
      throw new BadRequestException('User not found');
    }

    const totalPrice = validateProduct.price * quantity;

    // Create the invoice
    const invoice = this.invoiceRepo.create({
      ...rest,
      product: { id: product } as any,
      user: { id: user } as any,
      product_owner: { id: productOwner } as any,
      quantity,
      total_price: totalPrice,
    });

    const saveInvoice = await this.invoiceRepo.save(invoice);

    const virtualAccountResponse = await this.createVirtualAccount(
      validateUser.email,
      totalPrice,
    );

    if (!virtualAccountResponse || !virtualAccountResponse.data) {
      throw new BadRequestException('Failed to create virtual account');
    }

    // Update the order with the virtual account details
    saveInvoice.status = 'awaiting_payment';
    saveInvoice.updated_at = new Date();
    saveInvoice.reference = virtualAccountResponse.data.order_ref;
    saveInvoice.virtualAccountDetails = virtualAccountResponse.data;
    await this.invoiceRepo.save(saveInvoice);

    return saveInvoice;
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['user', 'product'],
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  // Method to find all invoices
  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      relations: ['user', 'product'],
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
      },
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
