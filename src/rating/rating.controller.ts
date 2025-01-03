import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { RatingService } from 'src/rating/rating.service';
import { CreateRatingDto } from 'src/rating/dto/create-rating.dto';

@Controller('api/v1/rating')
@ApiTags('Product Rating')
export class RatingController {
  private readonly logger = new Logger(RatingController.name);
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @ApiOperation({
    summary: 'Rate a merchant product.',
  })
  @ApiResponse({ status: 201, description: 'Rating created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to rate product' })
  @ApiBody({ type: CreateRatingDto })
  async create(@Req() req: any, @Body() createRatingDto: CreateRatingDto) {
    try {
      const user = req.user.id;
      const data = await this.ratingService.create(createRatingDto, user);
      return successResponse({
        message: 'Rating created successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }
}
