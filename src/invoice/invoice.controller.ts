import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Req,
  Get,
  Param,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-invoice.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { OrderService } from './service/order.service';
import { InvoiceService } from './service/invoice.service';
import { MerchantGuard } from 'src/core/guards/merchant.guard';
import { UserGuard } from 'src/core/guards/user.guard';

@ApiTags('Invoice/Order')
@Controller('api/v1/invoice')
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
  @UseGuards(MerchantGuard)
  async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    try {
      const user = req.user.id;
      const { invoices, createOrder } = createOrderDto;

      const data = await this.orderService.create(invoices, createOrder, user);

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

  @Get('user-orders')
  @ApiOperation({
    summary:
      'Get orders/invoice by user with optional status filter ("pending" or "paid")',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @UseGuards(UserGuard)
  async getOrdersByUserAndStatus(
    @Req() req: any,
    @Query('status') status?: 'pending' | 'paid',
  ) {
    try {
      const userId = req.user.id;
      const orders = await this.orderService.getOrdersByUserAndStatus(
        userId,
        status,
      );
      return successResponse({
        message: 'Orders retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: orders,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving orders by user and status',
        error.message,
      );
      throw error;
    }
  }

  @Get('merchant-recent-orders')
  @ApiOperation({
    summary:
      'Get orders/invoice by user with optional status filter ("pending" or "paid")',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @UseGuards(MerchantGuard)
  async getMerchantOrdersAndStatus(
    @Req() req: any,
    @Query('status') status?: 'pending' | 'paid',
  ) {
    try {
      const userId = req.user.id;
      const orders = await this.orderService.getOrdersByProductOwnerAndStatus(
        userId,
        status,
      );
      return successResponse({
        message: 'Orders retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: orders,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving orders by user and status',
        error.message,
      );
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getAllInvoices() {
    try {
      const invoices = await this.invoiceService.getAllInvoices();
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

  @Get('/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceById(@Param('id') id: string) {
    try {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      return successResponse({
        message: 'Invoice retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: invoice,
      });
    } catch (error) {
      this.logger.error('Error retrieving invoice', error.message);
      throw error;
    }
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders for the user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @UseGuards(UserGuard)
  async getAllOrders(@Req() req: any) {
    try {
      const userId = req.user.id;
      const orders = await this.orderService.getAllOrdersByUser(userId);
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

  @Get('order/:id')
  @ApiOperation({ summary: 'Get order by ID for the user' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @UseGuards(UserGuard)
  async getOrderById(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = req.user.id;
      const order = await this.orderService.getOrderByIdAndUser(id, userId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return successResponse({
        message: 'Order retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: order,
      });
    } catch (error) {
      this.logger.error('Error retrieving order', error.message);
      throw error;
    }
  }
}
