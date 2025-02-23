import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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

    const invoice = await this.adminInvoiceService.getAllOrdersByUser(
      search,
      status,
      page,
      limit,
    );

    return successResponse({
      message: 'Orders retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: invoice,
    });
  }

  @Get('withdrawal-request')
  @ApiOperation({
    summary: 'Get all withdrawals request for the merchant',
  })
  @ApiResponse({ status: 200, description: 'List of withdrawal Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWithdrawals(): Promise<any> {
    const withdrawals = await this.adminInvoiceService.getWithdrawalList();
    return {
      message:
        withdrawals.length === 0
          ? `No withdrawal request found`
          : `Withdrawal request retrieved successfully`,
      data: withdrawals,
      code: HttpStatus.OK,
      status: 'success',
    };
  }

  @Put('approve-withdrawal')
  @ApiOperation({
    summary: 'Approve/process merchant withdrawal',
  })
  @ApiQuery({
    name: 'withdrawalId',
    required: true,
    type: String,
    description: 'Number of products per page (for pagination)',
  })
  @ApiResponse({
    status: 200,
    description: 'Merchant withdrawal approved/processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unable to approve or process merchant withdrawal',
  })
  async approveWithdrawal(
    @Query('withdrawalId') withdrawalId: string,
  ): Promise<any> {
    await this.adminInvoiceService.approveMerchantWithdrawal(withdrawalId);

    return successResponse({
      message: `Merchant withdrawal approved/processed successfully`,
      code: HttpStatus.OK,
      status: 'success',
    });
  }
}
