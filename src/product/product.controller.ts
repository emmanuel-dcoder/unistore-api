import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Logger,
  Req,
  Param,
  Put,
  Get,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { UserGuard } from 'src/core/guards/user.guard';
import { MerchantGuard } from 'src/core/guards/merchant.guard';

@Controller('api/v1/product')
@ApiTags('Product')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a new product with uploaded images. Must be form-data; key: files - for product image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or product already exists.',
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  @UseGuards(MerchantGuard)
  async create(
    @Req() req: any,
    @Body() createProductDto: Partial<CreateProductDto>,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const user = req.user.id;
      const school = req.user.school.id;

      const data = await this.productService.create(
        createProductDto,
        files,
        user,
        school,
      );
      return successResponse({
        message: 'Product created successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('product/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') productId: string) {
    try {
      const product = await this.productService.findById(productId);
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      return successResponse({
        message: 'Product retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: product,
      });
    } catch (error) {
      this.logger.error('Error fetching product', error.message);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update an existing product. Optionally update product image(s). You have to use existing data and add your changes to the data',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or product not found',
  })
  @ApiBody({ type: CreateProductDto })
  @UseInterceptors(FilesInterceptor('files', 5))
  @UseGuards(MerchantGuard)
  async update(
    @Param('id') id: string,
    @Body()
    updateProductDto: Partial<CreateProductDto> & {
      school?: string;
      user?: string;
    },
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const updatedProduct = await this.productService.update(
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
      throw error;
    }
  }

  @Get('by-merchant-id/:merchantId')
  @ApiOperation({
    summary: 'Get merchants products  by id, with optional search',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Merchant products retrieved successfully',
  })
  @UseGuards(UserGuard)
  async getProductByMerchantId(
    @Req() req: any,
    @Param('merchantId') merchantId: string,
    @Query('search') search?: string,
  ) {
    try {
      const schoolId = req.user?.school?.id;
      const products = await this.productService.findByUser(
        merchantId,
        search,
        schoolId,
      );

      return successResponse({
        message: 'Merchant products retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: products,
      });
    } catch (error) {
      this.logger.error('Error fetching products for user', {
        error: error.message,
        userId: req.user?.id,
        search,
      });

      throw error;
    }
  }

  @Get('merchant-products')
  @ApiOperation({
    summary:
      'Get products that belong to the logged-in merchant, with optional search',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @UseGuards(MerchantGuard)
  async getUserProducts(@Req() req: any, @Query('search') search?: string) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.school?.id;

      const products = await this.productService.findByUser(
        userId,
        search,
        schoolId,
      );

      return successResponse({
        message: 'Products retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: products,
      });
    } catch (error) {
      this.logger.error('Error fetching products for user', {
        error: error.message,
        userId: req.user?.id,
        search,
      });

      throw error;
    }
  }

  @Get('products')
  @ApiOperation({
    summary: 'Get products with optional search by product name',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering products',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @UseGuards(UserGuard)
  async getProducts(@Req() req: any, @Query('search') search?: string) {
    try {
      const schoolId = req.user.school.id;
      const products = await this.productService.findAll(schoolId, search);
      return successResponse({
        message: 'Products retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: products,
      });
    } catch (error) {
      this.logger.error('Error fetching products', error.message);
      throw error;
    }
  }

  @Get('by-category-and-price')
  @ApiOperation({
    summary: 'Find products by category, price, and rating ranges',
    description:
      'Fetches products that belong to a specific category and fall within specified price and rating ranges.',
  })
  @ApiQuery({
    name: 'categoryName',
    type: String,
    required: true,
    description: 'Name of the category to filter products by',
  })
  @ApiQuery({
    name: 'minPrice',
    type: String,
    required: false,
    description: 'Minimum price of the products to filter by',
  })
  @ApiQuery({
    name: 'maxPrice',
    type: String,
    required: false,
    description: 'Maximum price of the products to filter by',
  })
  @ApiQuery({
    name: 'minRating',
    type: Number,
    required: false,
    description: 'Minimum average rating of the products to filter by',
  })
  @ApiQuery({
    name: 'maxRating',
    type: Number,
    required: false,
    description: 'Maximum average rating of the products to filter by',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products that match the conditions',
  })
  @ApiResponse({ status: 404, description: 'No products found' })
  @UseGuards(UserGuard)
  async getByCategoryAndPrice(
    @Req() req: any,
    @Query('categoryName') categoryName: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
  ) {
    try {
      const schoolId = req.user?.school?.id;

      const data = await this.productService.findByCategoryAndPrice(
        categoryName,
        {
          minPrice,
          maxPrice,
          minRating,
          maxRating,
        },
        schoolId,
      );

      return successResponse({
        message:
          data.length === 0
            ? 'No product found'
            : 'Products retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error fetching products by category and price', {
        error: error.message,
        categoryName,
        minPrice,
        maxPrice,
        minRating,
        maxRating,
      });

      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product by ID',
  })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @UseGuards(MerchantGuard)
  async delete(@Param('id') id: string) {
    try {
      await this.productService.delete(id);
      return successResponse({
        message: 'Product deleted successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Delete('delete-all')
  @ApiOperation({
    summary: 'Delete all products from the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'All products deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to delete products.',
  })
  @UseGuards(MerchantGuard)
  async deleteAll() {
    try {
      const response = await this.productService.deleteAll();
      return successResponse({
        message: response.message,
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }
}
