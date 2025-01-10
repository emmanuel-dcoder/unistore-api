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
      console.log(`Handling payment status for event: ${payload.status}`);

      switch (payload.status) {
        case 'successful':
          await this.handleSuccess(payload);
          break;
        case 'failed':
          await this.handleFailure(payload);
          break;
        case 'pending':
          await this.handlePending(payload);
          break;
        default:
          console.warn(`Unknown status: ${payload.status}`);
          break;
      }
    }
  }

  private async handleSuccess(payload: any) {
    const order = await this.getOrderByReference(
      payload.meta.authorization.transfer_reference,
    );
    if (order) {
      order.status = 'paid';
      await this.orderRepo.save(order);
      console.log(`Order ${order.reference} status updated to 'paid'`);
    }
  }

  private async handleFailure(payload: any) {
    const order = await this.getOrderByReference(
      payload.meta.authorization.transfer_reference,
    );
    if (order) {
      order.status = 'failed';
      await this.orderRepo.save(order);
      console.log(`Order ${order.reference} status updated to 'failed'`);
    }
  }

  private async handlePending(payload: any) {
    const order = await this.getOrderByReference(
      payload.meta.authorization.transfer_reference,
    );
    if (order) {
      order.status = 'pending';
      await this.orderRepo.save(order);
      console.log(`Order ${order.reference} status updated to 'pending'`);
    }
  }

  private async getOrderByReference(reference: string) {
    const order = await this.orderRepo.findOne({
      where: { reference },
    });
    if (!order) {
      console.warn(`Order with reference ${reference} not found.`);
    }
    return order;
  }
}
