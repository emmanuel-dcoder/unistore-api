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

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Product]), // Register the Product entity
  ],
  controllers: [OrderInvoiceController, WebhookController],
  providers: [InvoiceService, WebhookService],
})
export class InvoiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(OrderInvoiceController)
      .apply(VerifyTokenMiddleware);
  }
}
