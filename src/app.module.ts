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

@Module({
  imports: [
    TypeOrmModule.forRoot(dbconfig.getTypeOrmConfig()),
    UserModule,
    EventEmitterModule.forRoot(),
    CloudinaryModule,
    SchoolModule,
    ProductModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
