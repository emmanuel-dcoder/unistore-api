import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OrderInvoiceController } from './invoice.controller';
import { InvoiceService } from './service/invoice.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { User } from 'src/user/entities/user.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './service/webhook.service';
import { Product } from 'src/product/entities/product.entity';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/core/mail/email';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, User, Product, Notification])],
  controllers: [OrderInvoiceController, WebhookController],
  providers: [InvoiceService, WebhookService, NotificationService, MailService],
})
export class InvoiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(OrderInvoiceController)
      .apply(VerifyTokenMiddleware);
  }
}
