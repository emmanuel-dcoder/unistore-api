import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';

@ApiTags('Invoice/Order')
@Controller('api/v1/invoice')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Invoice for order while generating payment intent',
  })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({ status: 200, description: `Invoice Generated successfully` })
  @ApiResponse({ status: 401, description: 'Unable to create invoice.' })
  async create(@Req() req: any, @Body() createCategoryDto: CreateInvoiceDto) {
    try {
      const user = req.user.id;
      const data = await this.invoiceService.createInvoice(
        createCategoryDto,
        user,
      );
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
  @ApiOperation({
    summary: 'Get a single invoice by ID',
  })
  @ApiResponse({ status: 200, description: 'Invoice found successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@Param('id') id: string) {
    try {
      const data = await this.invoiceService.findInvoiceById(id);
      return successResponse({
        message: `Invoice found successfully`,
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
  @ApiOperation({
    summary: 'Get all invoices',
  })
  @ApiResponse({ status: 200, description: 'Invoices fetched successfully' })
  async getAllInvoices() {
    try {
      const data = await this.invoiceService.findAllInvoices();
      return successResponse({
        message: `Invoices fetched successfully`,
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
