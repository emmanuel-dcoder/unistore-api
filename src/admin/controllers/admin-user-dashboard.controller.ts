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
