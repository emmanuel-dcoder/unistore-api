import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async verifyOrderPaymentStatus(payload: any) {
    if (payload.event === 'charge.completed') {
      console.log(`Handling payment status for event: ${payload.data.status}`);

      switch (payload.data.status) {
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
          console.warn(`Unknown status: ${payload.data.status}`);
          break;
      }
    }
  }

  private async handleSuccess(payload: any) {
    const invoice = await this.getInvoiceByReference(payload.data.tx_ref);
    if (invoice) {
      invoice.status = 'paid';
      await this.invoiceRepo.save(invoice);
    }
  }

  private async handleFailure(payload: any) {
    const invoice = await this.getInvoiceByReference(payload.data.tx_ref);
    if (invoice) {
      invoice.status = 'failed';
      await this.invoiceRepo.save(invoice);
    }
  }

  private async handlePending(payload: any) {
    const invoice = await this.getInvoiceByReference(payload.data.tx_ref);
    if (invoice) {
      invoice.status = 'pending';
      await this.invoiceRepo.save(invoice);
    }
  }

  private async getInvoiceByReference(reference: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { reference },
    });
    if (!invoice) {
      console.warn(`Invoice with reference ${reference} not found.`);
    }
    return invoice;
  }
}
