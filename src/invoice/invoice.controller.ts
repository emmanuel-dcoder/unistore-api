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
  Param,
  Put,
} from '@nestjs/common';

import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { InvoiceService } from './service/invoice.service';
import { MerchantGuard } from 'src/core/guards/merchant.guard';
import { InvoicePayloadDto } from './dto/create-invoice.dto';

@ApiTags('Invoice/Order')
@Controller('api/v1/invoice')
export class OrderInvoiceController {
  private readonly logger = new Logger(OrderInvoiceController.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get an invoice by invoice_id',
  })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @UseGuards(MerchantGuard)
  async getInvoiceById(@Query('invoice_id') invoiceId: string) {
    if (!invoiceId) {
      throw new NotFoundException('Invoice ID is required');
    }

    const invoice = await this.invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return successResponse({
      message: 'Invoice retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: invoice,
    });
  }

  @Get('merchant-dashboard-analysis')
  @ApiOperation({
    summary: 'Get Analysis counts by status for a specific merchant',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis counts retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'No Analysis found for this owner' })
  @UseGuards(MerchantGuard)
  async getInvoiceCounts(@Req() req: any): Promise<any> {
    const userId = req.user.id;
    const counts = await this.invoiceService.getMerchantAnalysis(userId);
    if (!counts) {
      throw new NotFoundException('No Analysis found for this owner');
    }

    return successResponse({
      message: 'Analysis counts retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: counts,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create Invoice for order while generating payment intent',
  })
  @ApiBody({ type: InvoicePayloadDto })
  @ApiResponse({ status: 200, description: `Invoice Generated successfully` })
  @ApiResponse({ status: 401, description: 'Unable to create invoice.' })
  @UseGuards(MerchantGuard)
  async create(@Req() req: any, @Body() createOrderDto: InvoicePayloadDto) {
    const user = req.user.id;
    const data = await this.invoiceService.createInvoice(createOrderDto, user);
    return successResponse({
      message: `Invoice created successfully`,
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('merchant')
  @ApiOperation({
    summary: 'Get invoices by merchant with optional search',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    description: 'Search is optional',
  })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'No invoices found for this owner' })
  @UseGuards(MerchantGuard)
  async getInvoicesByOwnerWithSearch(
    @Req() req: any,
    @Query('search') search?: string,
  ): Promise<any> {
    const userId = req.user.id;

    const invoices =
      await this.invoiceService.getInvoicesByProductOwnerWithSearch(
        userId,
        search,
      );

    return successResponse({
      message:
        invoices.length === 0
          ? 'Currently no invoice'
          : 'Invoices retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: invoices,
    });
  }

  @Put('withdrawal-request')
  @ApiOperation({
    summary: 'Request withdrawal for paid invoices',
  })
  @ApiResponse({ status: 200, description: 'Invoice withdrawal successful' })
  @ApiResponse({ status: 401, description: 'Unable to request withdrawal' })
  @UseGuards(MerchantGuard)
  async requestWithdrawal(@Req() req: any): Promise<any> {
    const merchantId = req.user.id;
    const totalAmount = await this.invoiceService.invoiceWithdrawal(merchantId);

    return successResponse({
      message: `Invoice withdrawal for ${totalAmount}  successful`,
      code: HttpStatus.OK,
      status: 'success',
    });
  }

  @Get('withdrawal-request')
  @ApiOperation({
    summary: 'Get all withdrawals request for the merchant',
  })
  @ApiResponse({ status: 200, description: 'List of withdrawal Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(MerchantGuard)
  async getWithdrawals(@Req() req: any): Promise<any> {
    const merchantId = req.user.id;
    const withdrawals =
      await this.invoiceService.getMerchantWithdrawals(merchantId);
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
  //     await this.invoiceService.deleteAllInvoices();

  //     return successResponse({
  //       message: 'All invoices deleted successfully',
  //       code: HttpStatus.OK,
  //       status: 'success',
  //       data: null,
  //     });
  // }
}
