import * as dotenv from 'dotenv';
dotenv.config();
import {
  Controller,
  Post,
  Headers,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './service/webhook.service';

@Controller('api/v1/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(
    @Headers('verif-hash') verifHash: string,
    @Body() payload: any,
  ): Promise<any> {
    try {
      const secretHash = process.env.FLUTTERWAVE_SECRET_KEY;
      if (!secretHash) {
        throw new HttpException(
          'Server configuration error: Missing secret hash.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!verifHash || verifHash !== secretHash) {
        throw new HttpException(
          'Invalid webhook signature.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const sanitizedEvent = this.sanitizePayload(payload);

      // Handle payment status
      await this.webhookService.verifyOrderPaymentStatus(sanitizedEvent);

      return { status: 'success' };
    } catch (error) {
      console.error('Error processing webhook:', error.message);
      throw new HttpException(
        'Webhook handling failed.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private sanitizePayload(payload: any): any {
    const sanitizedPayload = { ...payload };
    if (sanitizedPayload.data?.customer?.email) {
      sanitizedPayload.data.customer.email = '****';
    }
    return sanitizedPayload;
  }
}
