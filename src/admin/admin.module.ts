import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { Admin } from './entities/admin.entity';
import { AdminInvoiceController } from './controllers/admin-invoice.controller';
import { AdminInvoiceService } from './services/admin-invoice.service';
import { Order } from 'src/invoice/entities/order.entity';
import { AdminProductController } from './controllers/admin-product.controller';
import { AdminProductService } from './services/admin-product.service';
import { Product } from 'src/product/entities/product.entity';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Order, Product, Category])],
  controllers: [
    AdminController,
    AdminInvoiceController,
    AdminProductController,
  ],
  providers: [
    AdminService,
    CloudinaryService,
    AdminInvoiceService,
    AdminProductService,
    CategoryService,
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(
      {
        path: 'api/v1/admin/logged-in',
        method: RequestMethod.GET,
      },
      {
        path: 'api/v1/admin/change-password',
        method: RequestMethod.PUT,
      },
      AdminInvoiceController,
      AdminProductController,
    );
  }
}
