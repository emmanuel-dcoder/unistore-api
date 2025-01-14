import * as crypto from 'crypto';
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
      // console.log('Received webhook:', this.sanitizePayload(payload));

      const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
      const computedHash = crypto
        .createHmac('sha256', secretHash)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Verify the webhook signature
      // if (verifHash !== computedHash) {
      //   throw new HttpException(
      //     'Invalid webhook signature.',
      //     HttpStatus.UNAUTHORIZED,
      //   );
      // }

      // Handle payment status
      await this.webhookService.verifyOrderPaymentStatus(payload);

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
