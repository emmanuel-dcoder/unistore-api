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

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  controllers: [AdminController],
  providers: [AdminService, CloudinaryService],
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
    );
  }
}
