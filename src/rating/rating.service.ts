import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    private readonly productService: ProductService,
  ) {}

  async create(createRatingDto: CreateRatingDto, user: string) {
    const { product, rating_number, comment } = createRatingDto;

    if (rating_number < 1 || rating_number > 5) {
      throw new BadRequestException('Rating number must be between 1 and 5');
    }

    const validate = await this.productService.findById(product);
    if (!validate) {
      throw new BadRequestException('Invalid product ID');
    }

    const rating = this.ratingRepo.create({
      rating_number,
      comment,
      product: { id: product } as any,
      ratedBy: { id: user } as any,
    });

    const result = await this.ratingRepo.save(rating);
    if (!result) {
      throw new BadRequestException('Unable to create rating');
    }

    // Update product average rating
    const ratings = await this.ratingRepo.find({
      where: { product: { id: product } },
    });
    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating_number, 0) / ratings.length;

    await this.productService.updateWithoutImage(product, {
      avg_rating: avgRating,
    });

    return result;
  }
}
