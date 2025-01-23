import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { User } from 'src/user/entities/user.entity';
import axios from 'axios';
import { RandomSevenDigits } from 'src/core/common';
import { InvoicePayloadDto } from '../dto/create-invoice.dto';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getMerchantAnalysis(userId: string): Promise<any> {
    const totalInvoice = await this.invoiceRepo.count({
      where: { product_owner: { id: userId } },
    });

    const totalProduct = await this.productRepo.count({
      where: { user: { id: userId } },
    });

    const total = await this.invoiceRepo.find({
      where: {
        product_owner: { id: userId },
        status: 'paid',
      },
    });

    const totalEarnings = total.reduce(
      (acc, invoice) => acc + invoice.total_price,
      0,
    );

    const pendingPayment = await this.invoiceRepo.count({
      where: {
        product_owner: { id: userId },
        status: 'awaiting_payment',
      },
    });

    return {
      totalInvoice,
      totalProduct,
      totalEarnings: Number(totalEarnings),
      pendingPayment,
    };
  }

  // Create an invoice
  async createInvoice(
    invoicePayloadDto: InvoicePayloadDto,
    user: string,
  ): Promise<Invoice> {
    const validateUser = await this.userRepo.findOne({
      where: { id: user },
    });

    if (!validateUser) {
      throw new BadRequestException('Invalid merchant');
    }

    let invoiceId = RandomSevenDigits();
    const validateInvoiceId = await this.invoiceRepo.findOne({
      where: { invoice_id: invoiceId },
    });

    let tx_ref = `order_${Date.now()}`;
    do {
      invoiceId = RandomSevenDigits();
    } while (validateInvoiceId);

    const paymentResponse = await this.createPaymentRequest(
      validateUser.email,
      invoicePayloadDto.total_price,
      tx_ref,
      validateUser.first_name + ' ' + validateUser.last_name,
      validateUser.phone,
    );

    if (!paymentResponse || paymentResponse.status !== 'success') {
      throw new BadRequestException('Failed to create payment request');
    }
    const invoice = await this.invoiceRepo.create({
      ...invoicePayloadDto,
      product_owner: { id: user } as any,
      invoice_id: invoiceId,
      products: invoicePayloadDto.products,
      total_price: invoicePayloadDto.total_price,
      status: 'awaiting_payment',
      payment_details: paymentResponse.meta.authorization,
      reference: tx_ref,
    });

    return await this.invoiceRepo.save(invoice);
  }

  async getInvoicesByProductOwnerWithSearch(
    productOwnerId: string,
    search?: string,
    limit?: number,
  ): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepo.createQueryBuilder('invoice');

    queryBuilder
      .leftJoinAndSelect('invoice.product_owner', 'product_owner')
      .where('invoice.product_owner.id = :productOwnerId', { productOwnerId });

    if (search) {
      const searchNumber = parseFloat(search); // Convert search to a number if possible
      const isNumber = !isNaN(searchNumber);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('invoice.invoice_id LIKE :search', {
            search: `%${search}%`,
          }).orWhere('invoice.products LIKE :search', {
            search: `%${search}%`,
          });

          if (isNumber) {
            qb.orWhere('invoice.total_price = :searchNumber', {
              searchNumber,
            });
          }
        }),
      );
    }
    queryBuilder.select([
      'invoice',
      'product_owner.first_name',
      'product_owner.last_name',
    ]);
    queryBuilder.orderBy('invoice.created_at', 'DESC');

    if (limit) {
      queryBuilder.take(5);
    }

    return queryBuilder.getMany();
  }

  // Delete all invoices
  async deleteAllInvoices(): Promise<void> {
    await this.invoiceRepo.clear(); // This removes all entries from the `Invoice` table.
  }
  private async createPaymentRequest(
    email: string,
    amount: number,
    tx_ref: string,
    fullname: string,
    phone_number: string,
  ): Promise<any> {
    const data = {
      amount,
      email,
      currency: 'NGN',
      tx_ref,
      fullname,
      phone_number,
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
