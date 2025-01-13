import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { AdminInvoiceService } from '../services/admin-invoice.service';
import { AdminGuard } from 'src/core/guards/admin.guard';
import { GetInvoicesQueryDto } from '../dto/invoice-admin.dto';

@ApiTags('Admin Invoice/Order')
@Controller('api/v1/admin-invoice')
@UseGuards(AdminGuard)
export class AdminInvoiceController {
  private readonly logger = new Logger(AdminInvoiceController.name);
  constructor(private readonly adminInvoiceService: AdminInvoiceService) {}

  @Get('invoice')
  @ApiOperation({
    summary:
      'Get all Invoices/Orders with optional search, status filter, and pagination',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getAllOrders(@Query() query: GetInvoicesQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;

    const orders = await this.adminInvoiceService.getAllOrdersByUser(
      search,
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
  }
}
