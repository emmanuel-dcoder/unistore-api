import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Product, User]), // Register the Product entity
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(InvoiceController)
      .apply(VerifyTokenMiddleware);
  }
}
