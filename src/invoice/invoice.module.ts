import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OrderInvoiceController } from './invoice.controller';
import { InvoiceService } from './service/invoice.service';
import { OrderService } from './service/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Invoice } from './entities/invoice.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Invoice, Product, User]), // Register the Product entity
  ],
  controllers: [OrderInvoiceController],
  providers: [InvoiceService, OrderService],
})
export class InvoiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(OrderInvoiceController)
      .apply(VerifyTokenMiddleware);
  }
}
