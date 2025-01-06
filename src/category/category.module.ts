import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { VerifyTokenMiddleware } from 'src/core/common/middlewares';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]), // Register the Product entity
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .forRoutes(CategoryController)
      .apply(VerifyTokenMiddleware);
  }
}
