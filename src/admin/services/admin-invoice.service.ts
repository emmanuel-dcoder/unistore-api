import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/invoice/entities/order.entity';

@Injectable()
export class AdminInvoiceService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async getAllOrdersByUser(
    searchQuery: string = '',
    status: string = '', // Optional status filter ('paid' or 'pending')
    page: number = 1,
    limit: number = 10,
  ): Promise<Order[]> {
    const skip = (page - 1) * limit;

    // Start building query with pagination
    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.product_owner', 'productOwner')

    // Apply search functionality if provided
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
        })
    }

    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    // Select only required fields for `user` and `product_owner`
    queryBuilder.addSelect([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.profile_picture',
      'user.email',
      'user.phone',
      'productOwner.id',
      'productOwner.first_name',
      'productOwner.last_name',
      'productOwner.profile_picture',
      'productOwner.email',
      'productOwner.phone',
    ]);

    // Pagination logic (skip, take, and sorting by created_at)
    queryBuilder.skip(skip).take(limit).orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    return orders;
  }
}
