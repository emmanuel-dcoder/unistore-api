import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { dbconfig } from './config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolModule } from './school/school.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { RatingModule } from './rating/rating.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { InvoiceModule } from './invoice/invoice.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dbconfig.getTypeOrmConfig()),
    UserModule,
    EventEmitterModule.forRoot(),
    CloudinaryModule,
    SchoolModule,
    ProductModule,
    CategoryModule,
    RatingModule,
    ChatModule,
    InvoiceModule,
    AdminModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
