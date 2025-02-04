import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ProductService } from 'src/product/product.service';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/core/mail/email';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  async create(createRatingDto: CreateRatingDto, user: string) {
    try {
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

      const ratings = await this.ratingRepo.find({
        where: { product: { id: product } },
      });
      const avgRating =
        ratings.reduce((sum, r) => sum + r.rating_number, 0) / ratings.length;

      await this.productService.updateWithoutImage(product, {
        avg_rating: avgRating,
      });

      try {
        await this.mailService.sendMailNotification(
          validate.user.email,
          'Product Rating',
          {
            name: validate.user.first_name,
            productName: validate.product_name,
            ratedBy: rating.ratedBy.first_name,
            ratings: rating_number,
          },
          'rating',
        );

        await this.notificationService.create(
          {
            title: 'Product Rating',
            message: `Hi, your product: ${validate.product_name}  has been rated ${rating_number} by ${rating.ratedBy.first_name}`,
          },
          validate.user.id,
        );
      } catch (error) {
        console.log('error:', error);
      }

      return result;
    } catch (error) {
      throw Error(error);
    }
  }

  async getRatingsByProduct(productId: string) {
    try {
      const ratings = await this.ratingRepo.find({
        where: { product: { id: productId } },
        relations: ['ratedBy'], // Populating the ratedBy field
        select: {
          ratedBy: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          },
        },
      });

      if (!ratings || ratings.length === 0) {
        throw new BadRequestException('No ratings found for this product');
      }

      return ratings;
    } catch (error) {
      throw Error(error);
    }
  }
}
