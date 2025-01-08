import { Controller, Get, Query, HttpStatus, Logger } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { AdminUserDashboardService } from '../services/admin-user-dashboard.service';

@ApiTags('Admin User & Dashboard')
@Controller('api/v1/admin-user-dashboard')
export class AdminUserDashboardController {
  private readonly logger = new Logger(AdminUserDashboardController.name);
  constructor(
    private readonly adminUserDashboardService: AdminUserDashboardService,
  ) {}

  @Get('orders/products/month')
  @ApiOperation({
    summary:
      'Get products related to orders with status "paid" and total amount for the month',
  })
  @ApiResponse({
    status: 200,
    description: 'Paid products for the month fetched',
  })
  async getPaidProductsForMonth() {
    try {
      const products =
        await this.adminUserDashboardService.getPaidProductsForMonth();
      return successResponse({
        message: 'Paid products for the month fetched',
        code: HttpStatus.OK,
        status: 'success',
        data: products,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving paid products for the month',
        error.message,
      );
      throw error;
    }
  }

  @Get('category-product-counts')
  @ApiOperation({
    summary:
      'Get the count of products in each category for paid orders, with percentage increase/decrease compared to previous month',
  })
  @ApiResponse({
    status: 200,
    description: 'Category product counts with percentage change',
  })
  async getCategoryProductCounts() {
    try {
      const categoryChanges =
        await this.adminUserDashboardService.getCategoryProductCounts();
      return successResponse({
        message: 'Category product counts fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: categoryChanges,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving category product counts',
        error.message,
      );
      throw error;
    }
  }

  @Get('product/highest')
  @ApiOperation({
    summary: 'Get products with the highest price',
  })
  @ApiResponse({ status: 200, description: 'Highest price products fetched' })
  async getHighestPriceProduct() {
    try {
      const products =
        await this.adminUserDashboardService.getHighestPriceProduct();
      return successResponse({
        message: 'Highest price products fetched',
        code: HttpStatus.OK,
        status: 'success',
        data: products,
      });
    } catch (error) {
      this.logger.error('Error retrieving products', error.message);
      throw error;
    }
  }

  @Get('user-order-counts')
  @ApiOperation({
    summary:
      'Get the count of orders and users (merchant and user) in the last 7 days with percentage change compared to previous 7 days',
  })
  @ApiResponse({
    status: 200,
    description:
      'User and Order counts with percentage change for the last 7 days',
  })
  async getUserAndOrderCounts() {
    try {
      const counts =
        await this.adminUserDashboardService.getUserAndOrderCounts();
      return successResponse({
        message: 'User and Order counts fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: counts,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving user and order counts',
        error.message,
      );
      throw error;
    }
  }

  @Get('invoice-orders')
  @ApiOperation({
    summary: 'Get invoice orders with pagination and filter by date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of orders per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date to filter orders',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date to filter orders',
    type: String,
    example: '2023-12-31',
  })
  @ApiResponse({ status: 200, description: 'Orders fetched successfully' })
  async getOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const orders =
        await this.adminUserDashboardService.getOrdersWithPagination(
          page,
          limit,
          startDate,
          endDate,
        );

      return successResponse({
        message: 'Orders fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: orders,
      });
    } catch (error) {
      this.logger.error('Error retrieving orders', error.message);
      throw error;
    }
  }

  @Get('category')
  @ApiOperation({
    summary: 'Get all Categories',
  })
  @ApiResponse({ status: 200, description: 'Categories fetched' })
  async getCategory() {
    try {
      const category = await this.adminUserDashboardService.findCategory();
      return successResponse({
        message: 'Categories fetched',
        code: HttpStatus.OK,
        status: 'success',
        data: category,
      });
    } catch (error) {
      this.logger.error('Error retrieving category', error.message);
      throw error;
    }
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get Users by user_type = "user" with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched by user_type "user"',
  })
  async getUsersByUserType(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    try {
      const users = await this.adminUserDashboardService.getUsersByUserType(
        'user',
        page,
        limit,
      );
      return successResponse({
        message: 'Users fetched by user_type "user"',
        code: HttpStatus.OK,
        status: 'success',
        data: users,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving users by user_type "user"',
        error.message,
      );
      throw error;
    }
  }

  @Get('merchants')
  @ApiOperation({
    summary: 'Get Users by user_type = "merchant" with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched by user_type "merchant"',
  })
  async getMerchants(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const users = await this.adminUserDashboardService.getUsersByUserType(
        'merchant',
        page,
        limit,
      );
      return successResponse({
        message: 'Users fetched by user_type "merchant"',
        code: HttpStatus.OK,
        status: 'success',
        data: users,
      });
    } catch (error) {
      this.logger.error(
        'Error retrieving users by user_type "merchant"',
        error.message,
      );
      throw error;
    }
  }

  @Get('inactive-users')
  @ApiOperation({
    summary: 'Get Users with is_active = false with pagination',
  })
  @ApiResponse({ status: 200, description: 'Inactive users fetched' })
  async getInactiveUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const users = await this.adminUserDashboardService.getInactiveUsers(
        page,
        limit,
      );
      return successResponse({
        message: 'Inactive users fetched',
        code: HttpStatus.OK,
        status: 'success',
        data: users,
      });
    } catch (error) {
      this.logger.error('Error retrieving inactive users', error.message);
      throw error;
    }
  }

  @Get('unverified-merchants')
  @ApiOperation({
    summary: 'Get Users with is_merchant_verified = false with pagination',
  })
  @ApiResponse({ status: 200, description: 'Unverified merchants fetched' })
  async getUnverifiedMerchants(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    try {
      const users = await this.adminUserDashboardService.getUnverifiedMerchants(
        page,
        limit,
      );
      return successResponse({
        message: 'Unverified merchants fetched',
        code: HttpStatus.OK,
        status: 'success',
        data: users,
      });
    } catch (error) {
      this.logger.error('Error retrieving unverified merchants', error.message);
      throw error;
    }
  }
}
