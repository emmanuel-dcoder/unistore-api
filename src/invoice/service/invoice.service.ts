import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { User } from 'src/user/entities/user.entity';
import { RandomSevenDigits } from 'src/core/common';
import { InvoicePayloadDto } from '../dto/create-invoice.dto';
import { Product } from 'src/product/entities/product.entity';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      return this.invoiceRepo.findOne({ where: { invoice_id: invoiceId } });
    } catch (error) {
      throw Error(error);
    }
  }

  async getMerchantAnalysis(userId: string): Promise<any> {
    try {
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
    } catch (error) {
      throw Error(error);
    }
  }

  // Create an invoice
  async createInvoice(
    invoicePayloadDto: InvoicePayloadDto,
    user: string,
  ): Promise<Invoice> {
    try {
      const validateUser = await this.userRepo.findOne({
        where: { id: user },
      });

      if (!validateUser) {
        throw new BadRequestException('Invalid merchant');
      }

      let tx_ref = `order_${Date.now()}`;
      let invoiceId;
      let validateInvoiceId;

      do {
        invoiceId = RandomSevenDigits();
        validateInvoiceId = await this.invoiceRepo.findOne({
          where: { invoice_id: invoiceId },
        });
      } while (validateInvoiceId);

      const paymentResponse =
        await this.flutterwaveService.createPaymentRequest(
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
    } catch (error) {
      throw Error(error);
    }
  }

  async getInvoicesByProductOwnerWithSearch(
    productOwnerId: string,
    search?: string,
    limit?: number,
  ): Promise<Invoice[]> {
    try {
      const queryBuilder = this.invoiceRepo.createQueryBuilder('invoice');

      queryBuilder
        .leftJoinAndSelect('invoice.product_owner', 'product_owner')
        .where('invoice.product_owner.id = :productOwnerId', {
          productOwnerId,
        });

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
    } catch (error) {
      throw Error(error);
    }
  }

  async deleteAllInvoices(): Promise<void> {
    await this.invoiceRepo.clear();
  }
}
