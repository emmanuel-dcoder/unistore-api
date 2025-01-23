import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { MailService } from 'src/core/mail/email';
import { SchoolService } from 'src/school/school.service';
import { School } from 'src/school/entities/school.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, School, Notification, Category, Product])],
  controllers: [UserController],
  providers: [
    UserService,
    CloudinaryService,
    MailService,
    SchoolService,
    NotificationService,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyTokenMiddleware).forRoutes(
      {
        path: 'api/v1/user',
        method: RequestMethod.GET,
      },
      {
        path: 'api/v1/user/update-password',
        method: RequestMethod.PUT,
      },
      {
        path: 'api/v1/user/:id/profile-picture',
        method: RequestMethod.PUT,
      },
      {
        path: 'api/v1/user/logged-in',
        method: RequestMethod.GET,
      },
      {
        path: 'api/v1/user/change-password',
        method: RequestMethod.PUT,
      },
    );
  }
}
