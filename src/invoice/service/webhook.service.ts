import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/core/mail/email';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
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
      const message = `Hi ${invoice.product_owner.first_name}, Payment for invoice with invoice id: ${invoice.invoice_id} is successful`;

      try {
        await this.mailService.sendMailNotification(
          invoice.product_owner.email,
          'Paid Invoice Payment Update',
          {
            name: invoice.product_owner.first_name,
            invoiceId: invoice.invoice_id,
            message,
          },
          'invoice_update',
        );

        await this.notificationService.create(
          {
            title: 'Paid Invoice Payment Update',
            message,
          },
          invoice.product_owner.email,
        );
      } catch (error) {
        console.log('error:', error);
      }
      await this.invoiceRepo.save(invoice);
    }
  }

  private async handleFailure(payload: any) {
    const invoice = await this.getInvoiceByReference(payload.data.tx_ref);
    if (invoice) {
      invoice.status = 'failed';
      const message = `Hi ${invoice.product_owner.first_name}, Payment for invoice with invoice id: ${invoice.invoice_id} is not successful`;
      try {
        await this.mailService.sendMailNotification(
          invoice.product_owner.email,
          'Failed Invoice Payment Update',
          {
            message,
          },
          'invoice_update',
        );
        await this.notificationService.create(
          {
            title: 'Failed Invoice Payment Update',
            message,
          },
          invoice.product_owner.email,
        );
      } catch (error) {
        console.log('error:', error);
      }
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
