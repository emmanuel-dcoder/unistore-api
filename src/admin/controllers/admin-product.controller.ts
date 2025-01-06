import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseInterceptors,
  Post,
  Body,
  UploadedFile,
  Param,
  UploadedFiles,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse, SuccessResponseType } from 'src/core/common';
import { AdminProductService } from '../services/admin-product.service';
import {
  AdminProductDto,
  CreateProductDto,
  ProductStatus,
} from 'src/product/dto/create-product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Admin Products')
@Controller('api/v1/admin-product')
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
  @ApiBody({ type: AdminProductDto }) // Can reuse CreateProductDto or define a specific update DTO
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
      throw error;
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
      throw error;
    }
  }
}
