import { Module } from '@nestjs/common';
import { OrderInvoiceController } from './invoice.controller';
import { InvoiceService } from './service/invoice.service';
import { OrderService } from './service/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Invoice } from './entities/invoice.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Invoice, Product, User]), // Register the Product entity
  ],
  controllers: [OrderInvoiceController],
  providers: [InvoiceService, OrderService],
})
export class InvoiceModule {}
