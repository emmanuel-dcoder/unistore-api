import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Req,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { InvoiceService } from './service/invoice.service';
import { MerchantGuard } from 'src/core/guards/merchant.guard';
import { InvoicePayloadDto } from './dto/create-invoice.dto';

@ApiTags('Invoice/Order')
@Controller('api/v1/invoice')
export class OrderInvoiceController {
  private readonly logger = new Logger(OrderInvoiceController.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Invoice for order while generating payment intent',
  })
  @ApiBody({ type: InvoicePayloadDto })
  @ApiResponse({ status: 200, description: `Invoice Generated successfully` })
  @ApiResponse({ status: 401, description: 'Unable to create invoice.' })
  @UseGuards(MerchantGuard)
  async create(@Req() req: any, @Body() createOrderDto: InvoicePayloadDto) {
    try {
      const user = req.user.id;

      const data = await this.invoiceService.createInvoice(
        createOrderDto,
        user,
      );

      return successResponse({
        message: `Invoice created successfully`,
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('merchant')
  @ApiOperation({
    summary: 'Get invoices by merchant with optional search',
  })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'No invoices found for this owner' })
  @UseGuards(MerchantGuard)
  async getInvoicesByOwnerWithSearch(
    @Req() req: any,
    @Query('search') search?: string,
  ): Promise<any> {
    try {
      const userId = req.user.id;

      const invoices =
        await this.invoiceService.getInvoicesByProductOwnerWithSearch(
          userId,
          search,
        );

      if (!invoices || invoices.length === 0) {
        throw new NotFoundException('No invoices found for this owner');
      }

      return successResponse({
        message: 'Invoices retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: invoices,
      });
    } catch (error) {
      this.logger.error('Error retrieving invoices', error.message);
      throw error;
    }
  }

  // @Delete('all')
  // @ApiOperation({ summary: 'Delete all invoices' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'All invoices deleted successfully',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 500, description: 'Internal server error' })
  // @UseGuards(MerchantGuard) // Optional: Protect the endpoint with a guard
  // async deleteAll(): Promise<any> {
  //   try {
  //     await this.invoiceService.deleteAllInvoices();

  //     return successResponse({
  //       message: 'All invoices deleted successfully',
  //       code: HttpStatus.OK,
  //       status: 'success',
  //       data: null,
  //     });
  //   } catch (error) {
  //     this.logger.error('Error deleting invoices', error.message);
  //     throw error;
  //   }
  // }
}
