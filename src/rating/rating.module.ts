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

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Product, Category]), // Register the Product entity
  ],
  controllers: [RatingController],
  providers: [
    RatingService,
    ProductService,
    CloudinaryService,
    CategoryService,
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
