import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async verifyOrderPaymentStatus(payload: any) {
    if (payload.event === 'charge.completed') {
      if (payload.status === 'successful') {
        await this.handleSuccess(payload);
      } else if (payload.status === 'failed') {
        await this.handleFailure(payload);
      } else if (payload.status === 'pending') {
        await this.handlePending(payload);
      }
    }
  }

  private async handleSuccess(payload: any) {
    console.log('this is for webhook payload', payload);
    const order = await this.orderRepo.findOne({
      where: { reference: payload.meta.authorization.transfer_reference },
    });
    if (order) {
      order.status = 'paid';
      await this.orderRepo.save(order);
    }
    return order;
  }

  private async handleFailure(payload: any) {
    const order = await this.orderRepo.findOne({
      where: { reference: payload.meta.authorization.transfer_reference },
    });
    if (order) {
      order.status = 'failed';
      await this.orderRepo.save(order);
    }
    return order;
  }

  private async handlePending(payload: any) {
    const order = await this.orderRepo.findOne({
      where: { reference: payload.meta.authorization.transfer_reference },
    });
    if (order) {
      order.status = 'pending'; // You can customize the status or message
      await this.orderRepo.save(order);
    }
    return order;
  }
}
