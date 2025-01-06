import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse, SuccessResponseType } from 'src/core/common';
import { AdminInvoiceService } from '../services/admin-invoice.service';
import { AdminGuard } from 'src/core/guards/admin.guard';

@ApiTags('Admin Invoice/Order')
@Controller('api/v1/admin-invoice')
@UseGuards(AdminGuard)
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
    @Query('search') searchQuery: string = '',
    @Query('status') status: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
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
