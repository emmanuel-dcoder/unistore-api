import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
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

  @Get('school/:id/merchants/stats')
  @ApiOperation({
    summary:
      'Get the count of products and orders for all merchants within a specific school, including optional search and pagination',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the school',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Optional search term for filtering products and orders by merchant name',
    type: String,
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
    description: 'Limit number of results per page (default is 10)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Merchant product and order statistics fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch merchant product and order statistics',
  })
  async getMerchantStats(
    @Param('id') schoolId: string,
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      // Fetch statistics using the adminUserDashboardService
      const stats = await this.adminUserDashboardService.getMerchantStats(
        schoolId,
        search,
        page,
        limit,
      );

      return successResponse({
        message: 'Merchant product and order statistics fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: stats,
      });
    } catch (error) {
      this.logger.error(
        `Error retrieving statistics for merchants in school with ID ${schoolId}`,
        error.message,
      );
      throw error;
    }
  }

  @Get(':id/users')
  @ApiOperation({
    summary:
      'Get users (merchant or user) by school ID with optional filters and pagination',
  })
  @ApiQuery({
    name: 'user_type',
    required: false,
    description: 'Filter by user type ("merchant" or "user")',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Start date for filtering users (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'End date for filtering users (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page (default is 10)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Users retrieved successfully based on user_type and date filters',
  })
  async getUsersBySchool(
    @Param('id') schoolId: string,
    @Query('user_type') userType: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const data =
        await this.adminUserDashboardService.findUsersBySchoolAndType(
          schoolId,
          userType,
          startDate,
          endDate,
          page,
          limit,
        );
      return successResponse({
        message: 'Users retrieved successfully',
        code: 200,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error(
        'Error fetching users by school and type',
        error.message,
      );
      throw error;
    }
  }

  @Get('counts/:schoolId')
  @ApiOperation({ summary: 'Get the count of merchants and users in a school' })
  @ApiParam({ name: 'schoolId', description: 'ID of the school' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User counts retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Unable to fetch user counts',
  })
  async getUserCountsBySchool(@Param('schoolId') schoolId: string) {
    try {
      const userCounts =
        await this.adminUserDashboardService.getUserCountsBySchool(schoolId);
      return successResponse({
        message: 'User counts retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: userCounts,
      });
    } catch (error) {
      this.logger.error(
        `Error fetching user counts for school with ID ${schoolId}`,
        error.message,
      );
      throw error;
    }
  }

  @Get('with-orders')
  @ApiOperation({
    summary: 'Get users with their order counts',
    description:
      'This endpoint retrieves a paginated list of users with `user_type` set to "user". It includes their total order counts (paid and pending) and filters by a specific school ID. Optional search functionality is provided to search users by their first name, last name, or email.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination. Default is 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of results per page. Default is 10.',
  })
  @ApiQuery({
    name: 'school_id',
    required: true,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the school to filter users by.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'john',
    description: "Search query for user's first name, last name, or email.",
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the list of users with order counts.',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters.' })
  @ApiResponse({ status: 404, description: 'School ID not found.' })
  async getUsersWithOrderCounts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('school_id') school_id: string,
    @Query('search') search: string,
  ) {
    try {
      // Call the service to fetch the data
      const result =
        await this.adminUserDashboardService.getUsersWithOrderCounts(
          page,
          limit,
          school_id,
          search,
        );

      return successResponse({
        message: 'Successfully retrieved the list of users with order counts.',
        code: HttpStatus.OK,
        status: 'success',
        data: result,
      });
    } catch (error) {
      this.logger.error(`Error:`, error.message);
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
