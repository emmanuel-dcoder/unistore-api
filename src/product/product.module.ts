import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryService } from 'src/category/category.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/notification.service';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, User, Notification])],
  controllers: [ProductController],
  providers: [
    ProductService,
    CategoryService,
    CloudinaryService,
    UserService,
    MailService,
    NotificationService,
    FlutterwaveService,
  ],
})
export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(ProductController)
      .apply(VerifyTokenMiddleware);
  }
}
