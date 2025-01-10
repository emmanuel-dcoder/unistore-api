import { Controller, Post, Body, Headers } from '@nestjs/common';
import { WebhookService } from './service/webhook.service';

@Controller('api/v1/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async verifyWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature: string,
  ) {
    console.log('webhook body', payload);
    const secretHash = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!signature || signature !== secretHash) {
      return { status: 'invalid_signature' };
    }
    try {
      await this.webhookService.verifyOrderPaymentStatus(payload);
      return { status: 200 };
    } catch (error) {
      console.log('webhook error:', error);
      return { status: 401 };
    }
  }
}
