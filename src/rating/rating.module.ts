import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { Product } from 'src/product/entities/product.entity';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { ProductService } from 'src/product/product.service';
import { Rating } from './entities/rating.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/entities/category.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/core/mail/email';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Product, Category, Notification, User]),
  ],
  controllers: [RatingController],
  providers: [
    RatingService,
    ProductService,
    CloudinaryService,
    CategoryService,
    NotificationService,
    MailService,
    UserService,
    FlutterwaveService,
  ],
})
export class RatingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(RatingController)
      .apply(VerifyTokenMiddleware);
  }
}
