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
import { AdminProductController } from './controllers/admin-product.controller';
import { AdminProductService } from './services/admin-product.service';
import { Product } from 'src/product/entities/product.entity';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/entities/category.entity';
import { User } from 'src/user/entities/user.entity';
import { AdminUserDashboardService } from './services/admin-user-dashboard.service';
import { AdminUserDashboardController } from './controllers/admin-user-dashboard.controller';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { School } from 'src/school/entities/school.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { MailService } from 'src/core/mail/email';
import { Withdrawal } from 'src/invoice/entities/withdrawal.entity';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Product,
      Invoice,
      Category,
      User,
      School,
      Notification,
      Withdrawal,
    ]),
  ],
  controllers: [
    AdminController,
    AdminInvoiceController,
    AdminProductController,
    AdminUserDashboardController,
  ],
  providers: [
    AdminService,
    CloudinaryService,
    AdminInvoiceService,
    AdminProductService,
    CategoryService,
    AdminUserDashboardService,
    MailService,
    NotificationService,
    FlutterwaveService,
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
      AdminUserDashboardController,
    );
  }
}
