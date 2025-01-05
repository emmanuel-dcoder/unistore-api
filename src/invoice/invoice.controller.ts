import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-invoice.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { OrderService } from './service/order.service';
import { InvoiceService } from './service/invoice.service';

@ApiTags('Invoice/Order')
@Controller('api/v1/orders-invoices')
export class OrderInvoiceController {
  private readonly logger = new Logger(OrderInvoiceController.name);
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'NOTE: the invoice payload is an array of objects in this:  { productId: string; quantity: number } Create Invoice for order while generating payment intent',
  })
  @ApiBody({ type: CreateOrderDto }) // Ensure CreateInvoiceDto matches the expected structure
  @ApiResponse({ status: 200, description: `Invoice Generated successfully` })
  @ApiResponse({ status: 401, description: 'Unable to create invoice.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      // const user = req.user.id;
      const { invoices, createOrder } = createOrderDto;

      const data = await this.orderService.create(invoices, createOrder);

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
}
