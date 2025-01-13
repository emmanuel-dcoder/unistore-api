import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Repository } from 'typeorm';


@Injectable()
export class AdminInvoiceService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async getAllOrdersByUser(
    searchQuery: string = '',
    status: string = '',
    page: number = 1,
    limit: number = 10,
  ): Promise<Invoice[]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.product_owner', 'productOwner');

    if (searchQuery) {
      queryBuilder
        .where('order.order_id LIKE :searchQuery', {
          searchQuery: `%${searchQuery}%`,
        })
        .orWhere('user.first_name LIKE :searchQuery', {
          searchQuery: `%${searchQuery}%`,
        })
        .orWhere('user.last_name LIKE :searchQuery', {
          searchQuery: `%${searchQuery}%`,
        })
        .orWhere('order.status LIKE :searchQuery', {
          searchQuery: `%${searchQuery}%`,
        });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    queryBuilder.addSelect([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.profile_picture',
      'user.email',
      'user.phone',
      'product_owner.id',
      'product_owner.first_name',
      'product_owner.last_name',
      'product_owner.profile_picture',
      'product_owner.email',
      'product_owner.phone',
    ]);

    queryBuilder.skip(skip).take(limit).orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    return orders;
  }
}
