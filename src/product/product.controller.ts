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
import { MerchantGuard } from 'src/core/guards/merchant.guard.ts';

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

      // Pass the extracted data along with other fields to the service
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
  @ApiBody({ type: CreateProductDto }) // Can reuse CreateProductDto or define a specific update DTO
  @UseInterceptors(FilesInterceptor('files', 5))
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
  @Get('merchant-products')
  @ApiOperation({
    summary:
      'Get products that belong to the logged-in merchant, with optional search',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @UseGuards(MerchantGuard)
  async getUserProducts(@Req() req: any, @Query('search') search?: string) {
    try {
      // Extract userId and validate
      const userId = req.user?.id;

      // Fetch products with optional search
      const products = await this.productService.findByUser(userId, search);

      // Return success response
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

      // Transform error into user-friendly response if necessary
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
  async getProducts(
    @Query('search') search?: string, // Optional query parameter
  ) {
    try {
      const products = await this.productService.findAll(search);
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
    summary: 'Find products by category and price',
    description:
      'Fetches products that belong to a specific category and have a specific price.',
  })
  @ApiQuery({
    name: 'categoryName',
    type: String,
    required: true,
    description: 'Name of the category to filter products by',
  })
  @ApiQuery({
    name: 'price',
    type: Number,
    required: true,
    description: 'Price of the products to filter by',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products that match the category name and price',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getByCategoryAndPrice(
    @Query('categoryName') categoryName: string,
    @Query('price') price: number,
  ) {
    const data = await this.productService.findByCategoryAndPrice(
      categoryName,
      price,
    );

    return successResponse({
      message: 'List of products that match the category name and price',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
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
