import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
}
