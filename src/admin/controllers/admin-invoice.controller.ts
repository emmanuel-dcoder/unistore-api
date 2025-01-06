import { Controller, Get, Query, HttpStatus, Logger } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse, SuccessResponseType } from 'src/core/common';
import { AdminInvoiceService } from '../services/admin-invoice.service';

@ApiTags('Admin Invoice/Order')
@Controller('api/v1/admin-invoice')
export class AdminInvoiceController {
  private readonly logger = new Logger(AdminInvoiceController.name);
  constructor(private readonly adminInvoiceService: AdminInvoiceService) {}
  
  @Get('invoice')
  @ApiOperation({
    summary:
      'Get all Invoices/Orders with search, status filter, and pagination',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getAllOrders(
    @Query('search') searchQuery: string = '', // Optional search query
    @Query('status') status: string = '', // Optional status filter (either "paid" or "pending")
    @Query('page') page: number = 1, // Optional pagination page
    @Query('limit') limit: number = 10, // Optional pagination limit
  ) {
    try {
      const orders = await this.adminInvoiceService.getAllOrdersByUser(
        searchQuery,
        status,
        page,
        limit,
      );
      return successResponse({
        message: 'Orders retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: orders,
      });
    } catch (error) {
      this.logger.error('Error retrieving orders', error.message);
      throw error;
    }
  }
}
