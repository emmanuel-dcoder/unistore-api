import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Query,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api/v1/category')
@ApiTags('Category')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: `Category retrieved successfully` })
  @ApiResponse({ status: 404, description: `Category not found` })
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.categoryService.findOne(id);
      return successResponse({
        message: `Category retrieved successfully`,
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter categories by name (optional)',
  })
  @ApiResponse({
    status: 200,
    description: `Categories retrieved successfully`,
  })
  async findAll(@Query('search') search?: string) {
    try {
      const data = await this.categoryService.findAll(search);
      return successResponse({
        message: `Categories retrieved successfully`,
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiResponse({ status: 200, description: `Category deleted successfully` })
  @ApiResponse({ status: 404, description: `Category not found` })
  async delete(@Param('id') id: string) {
    try {
      await this.categoryService.delete(id);
      return successResponse({
        message: `Category deleted successfully`,
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update or edit category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.categoryService.update(id, updateCategoryDto);
    return successResponse({
      message: 'Category updated successfully',
      code: HttpStatus.OK,
      status: 'success',
    });
  }
}
