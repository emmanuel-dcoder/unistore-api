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
      } else {
        await this.handleFailure(payload);
      }
    }
  }

  private async handleSuccess(payload: any) {
    const order = await this.orderRepo.findOne({
      where: { reference: payload.meta.authorization.transfer_reference },
    });
    order.status = 'paid';
    await this.orderRepo.save(order);
    return order;
  }
  private async handleFailure(payload: any) {
    const order = await this.orderRepo.findOne({
      where: { reference: payload.meta.authorization.transfer_reference },
    });
    order.status = 'failed';
    await this.orderRepo.save(order);
    return order;
  }
}
