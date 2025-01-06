import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseInterceptors,
  Post,
  Body,
  Param,
  UploadedFiles,
  Put,
  Delete,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse, SuccessResponseType } from 'src/core/common';
import { AdminProductService } from '../services/admin-product.service';
import {
  AdminProductDto,
  ProductStatus,
} from 'src/product/dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Product } from 'src/product/entities/product.entity';
import { AdminGuard } from 'src/core/guards/admin.guard';

@ApiTags('Admin Products')
@Controller('api/v1/admin-product')
@UseGuards(AdminGuard)
export class AdminProductController {
  private readonly logger = new Logger(AdminProductController.name);
  constructor(private readonly adminProductService: AdminProductService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a new product with uploaded images. Must be form-data; key: files - for product image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create product' })
  @ApiBody({ type: AdminProductDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or product already exists.',
  })
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() adminProductDto: AdminProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const data = await this.adminProductService.create(
        adminProductDto,
        files,
      );
      return successResponse({
        message: 'Product created successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update an existing product. Optionally update product image(s). You have to use existing data and add your changes to the data',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or product not found',
  })
  @ApiBody({ type: AdminProductDto })
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id') id: string,
    @Body()
    updateProductDto: Partial<AdminProductDto> & {
      school?: string;
      user?: string;
    },
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const updatedProduct = await this.adminProductService.update(
        id,
        updateProductDto,
        files,
      );
      return successResponse({
        message: 'Product updated successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: updatedProduct,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update the product status (verified or not-verified)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID or status',
  })
  @ApiBody({
    type: String,
    description: 'Status to update to ("verified" or "not-verified")',
  })
  async updateStatus(@Param('id') id: string, @Body() status: ProductStatus) {
    try {
      const updatedProduct = await this.adminProductService.updateStatus(
        id,
        status,
      );
      return successResponse({
        message: 'Product status updated successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: updatedProduct,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({
    summary:
      'Get products with optional filters including search functionality and pagination.',
    description:
      'Fetch products with optional filters for status, product_id, product_name, category, and price. A search query is available to search across multiple fields. Pagination is supported with limit and page parameters.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter products by status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search products by product_id, product_name, category, or price',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products per page (for pagination)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (for pagination)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products per page (for pagination)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (for pagination)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products matching the filters.',
    type: [Product],
  })
  async getProducts(
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    try {
      const { products, total } = await this.adminProductService.findProducts({
        status,
        search,
        limit,
        page,
      });

      return successResponse({
        message: 'Products fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: { products, total, page, limit },
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw new BadRequestException(error.message);
    }
  }
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product by ID',
    description: 'This endpoint deletes a product from the database by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the product to be deleted',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: 'Product deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Product not found or unable to delete',
    schema: {
      example: {
        statusCode: 400,
        message: 'Product not found',
        error: 'Bad Request',
      },
    },
  })
  async deleteProduct(@Param('id') id: string) {
    try {
      try {
        await this.adminProductService.deleteProduct(id);
        return successResponse({
          message: 'Product deleted successfully',
          code: HttpStatus.OK,
          status: 'success',
        });
      } catch (error) {}
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
