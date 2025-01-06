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
} from 'src/product/dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('files'))
  async create(
    @Body() adminProductDto: AdminProductDto,
    @UploadedFile() files: Array<Express.Multer.File>,
  ) {
    try {
      // Pass the extracted data along with other fields to the service
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
}
