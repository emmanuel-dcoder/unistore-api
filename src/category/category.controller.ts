import { Controller, Post, Body, Logger, HttpStatus } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';

@Controller('category')
@ApiTags('Category')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Reset password with the token provided' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 200, description: `Category created successfully` })
  @ApiResponse({ status: 401, description: 'Unable to create category.' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const data = await this.categoryService.create(createCategoryDto);
      return successResponse({
        message: `Category created successfully`,
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
