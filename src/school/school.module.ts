import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  controllers: [SchoolController],
  providers: [SchoolService, CloudinaryService],
})
export class SchoolModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(SchoolController)
      .apply(VerifyTokenMiddleware);
  }
}
