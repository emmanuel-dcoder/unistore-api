import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Withdrawal } from 'src/invoice/entities/withdrawal.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminInvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    private readonly flutterwaverService: FlutterwaveService,
  ) {}

  async getAllOrdersByUser(
    searchQuery?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<Invoice[]> {
    try {
      const skip = (page - 1) * limit;

      const queryBuilder = this.invoiceRepo
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.product_owner', 'productOwner');

      if (searchQuery) {
        queryBuilder
          .where('invoice.invoice_id LIKE :searchQuery', {
            searchQuery: `%${searchQuery}%`,
          })
          .orWhere('productOwner.first_name LIKE :searchQuery', {
            searchQuery: `%${searchQuery}%`,
          })
          .orWhere('productOwner.last_name LIKE :searchQuery', {
            searchQuery: `%${searchQuery}%`,
          })
          .orWhere('invoice.status LIKE :searchQuery', {
            searchQuery: `%${searchQuery}%`,
          });
      }

      if (status) {
        queryBuilder.andWhere('invoice.status = :status', { status });
      }

      queryBuilder.addSelect([
        'productOwner.id',
        'productOwner.first_name',
        'productOwner.last_name',
        'productOwner.profile_picture',
        'productOwner.email',
        'productOwner.phone',
      ]);

      queryBuilder.skip(skip).take(limit).orderBy('invoice.created_at', 'DESC');

      const invoice = await queryBuilder.getMany();
      return invoice;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getWithdrawalList(): Promise<Withdrawal[]> {
    try {
      return this.withdrawalRepo.find({
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  /**
   * approve merchant withdrawal
   */

  async approveMerchantWithdrawal(payload: string): Promise<any> {
    try {
      const confirmWithdrawal = await this.withdrawalRepo.findOne({
        where: { id: payload },
      });

      if (!confirmWithdrawal)
        throw new BadRequestException('Invalid withdrawal id');

      console.log('this is getting here');
      const reference = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const transfer = await this.flutterwaverService.initiateBankTransfer({
        account_bank: '044',
        account_number: '0724212361',
        amount: 100,
        currency: 'NGN',
        narration: 'Payment for services',
        reference,
        debit_currency: 'NGN',
      });

      console.log('this is getting here one', transfer);

      if (!transfer || transfer.status !== 'success') {
        throw new BadRequestException('Failed to create transfer request');
      }

      console.log('this is getting here one');

      const updateData = { withdrawal_approved: true };

      Object.assign(confirmWithdrawal, updateData);
      return this.withdrawalRepo.save(confirmWithdrawal);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
