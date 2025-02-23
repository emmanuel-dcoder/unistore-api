import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { User } from 'src/user/entities/user.entity';
import { RandomSevenDigits } from 'src/core/common';
import { InvoicePayloadDto } from '../dto/create-invoice.dto';
import { Product } from 'src/product/entities/product.entity';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/notification.service';
import { Withdrawal } from '../entities/withdrawal.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      return this.invoiceRepo.findOne({ where: { invoice_id: invoiceId } });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
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
          is_withdrawn: false,
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
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
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
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
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
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async invoiceWithdrawal(merchantId: string): Promise<number> {
    try {
      const merchant = await this.userRepo.findOne({
        where: {
          id: merchantId,
        },
      });

      if (!merchant) throw new BadRequestException('Invalid merchant id.');

      const invoices = await this.invoiceRepo.find({
        where: {
          product_owner: { id: merchantId },
          status: 'paid',
          is_withdrawn: false,
          withdrawal_approved: false,
          withdrawal_request: false,
        },
      });

      if (invoices.length === 0) {
        throw new BadRequestException(
          'No eligible invoices found for withdrawal request or still awaiting payment.',
        );
      }

      const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_price),
        0,
      );

      await this.invoiceRepo
        .createQueryBuilder()
        .update(Invoice)
        .set({ withdrawal_request: true })
        .where('product_owner_id = :merchantId', { merchantId })
        .andWhere('status = :paidStatus', { paidStatus: 'paid' })
        .andWhere('is_withdrawn = :withdrawn', { withdrawn: false })
        .andWhere('withdrawal_approved = :approved', { approved: false })
        .andWhere('withdrawal_request = :request', { request: false })
        .execute();

      try {
        await this.mailService.sendMailNotification(
          merchant.email,
          `Withdrawal Request`,
          {
            message: `Hi, ${merchant.first_name}, you withdrawal of ${totalAmount} is been reviewed and processed`,
          },
          'withdrawal',
        );

        await this.notificationService.create(
          {
            title: `Withdrawal Request`,
            message: `Hi, ${merchant.first_name}, you withdrawal of ${totalAmount} is been reviewed and processed`,
          },
          merchant.id,
        );
      } catch (error) {
        console.log('error:', error);
      }

      await this.withdrawalRepo.save({
        merchant: { id: merchantId } as any,
        withdrawal_request: true,
        amount: totalAmount,
      });

      return totalAmount;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getMerchantWithdrawals(merchantId: string): Promise<Withdrawal[]> {
    try {
      return this.withdrawalRepo.find({
        where: { merchant: { id: merchantId } },
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteAllInvoices(): Promise<void> {
    try {
      await this.invoiceRepo.clear();
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
