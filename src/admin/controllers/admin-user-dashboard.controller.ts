import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  Param,
  BadRequestException,
  Body,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { AdminUserDashboardService } from '../services/admin-user-dashboard.service';
import { PaginationDto } from '../dto/invoice-admin.dto';
import { School } from 'src/school/entities/school.entity';
import { MerchantPaginationDto } from '../dto/update-admin.dto';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Admin User & Dashboard')
@Controller('api/v1/admin-user-dashboard')
export class AdminUserDashboardController {
  private readonly logger = new Logger(AdminUserDashboardController.name);
  constructor(
    private readonly adminUserDashboardService: AdminUserDashboardService,
  ) {}

  @Post('create-user')
  @ApiOperation({
    summary: `Create a new user with "merchant' or "user" as user_type`,
  })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        description: { type: 'string' },
        user_type: {
          type: 'string',
          enum: ['user', 'merchant'],
          default: 'user',
        },
      },
    },
  })
  async createUser(
    @Body()
    payload: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      user_type: string;
      description?: string;
    },
  ) {
    const user = await this.adminUserDashboardService.createUser(payload);
    return successResponse({
      message: 'User successfully created',
      code: HttpStatus.CREATED,
      status: 'success',
      data: user,
    });
  }

  @Get('user-merchant-invoice-counts')
  @ApiOperation({
    summary:
      'Get the count of Invoice and users (merchant and user) in the last 7 days with percentage change compared to previous 7 days',
  })
  @ApiResponse({
    status: 200,
    description:
      'User and invoice counts with percentage change for the last 7 days',
  })
  async getUserAndOInvoiceCounts() {
    const counts =
      await this.adminUserDashboardService.getUserAndOInvoiceCounts();
    return successResponse({
      message: 'User and Invoice counts fetched successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: counts,
    });
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

  @Get('new-merchants')
  @ApiOperation({
    summary: 'Get all merchants',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of users per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched by user_type "merchant"',
  })
  async getMerchants(@Query('page') page = 1, @Query('limit') limit = 10) {
    const users = await this.adminUserDashboardService.getUsersByUserType(
      Role.MERCHANT,
      page,
      limit,
    );
    return successResponse({
      message: 'Users fetched by user_type "merchant"',
      code: HttpStatus.OK,
      status: 'success',
      data: users,
    });
  }

  @Get('new-users')
  @ApiOperation({
    summary: 'Get Users by user_type = "user" with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched by user_type "user"',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of users per page (default: 10)',
  })
  async getUsersByUserType(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const users = await this.adminUserDashboardService.getUsersByUserType(
      Role.BUYER,
      page,
      limit,
    );
    return successResponse({
      message: 'Users retrieved successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: users,
    });
  }

  @Get('recent-invoice')
  @ApiOperation({
    summary: 'Get invoice Invoice with pagination and filter by date',
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
    description: 'Limit number of Invoice per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date to filter Invoice',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date to filter Invoice',
    type: String,
    example: '2025-12-31',
  })
  @ApiResponse({ status: 200, description: 'Invoice fetched successfully' })
  async getOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const orders =
      await this.adminUserDashboardService.getInvoiceWithPagination(
        page,
        limit,
        startDate,
        endDate,
      );

    return successResponse({
      message: 'Invoice fetched successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: orders,
    });
  }

  @Get('unverified-merchants')
  @ApiOperation({
    summary: 'Get Users with is_merchant_verified = false with pagination',
  })
  @ApiResponse({ status: 200, description: 'Unverified merchants fetched' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of users per page (default: 10)',
  })
  async getUnverifiedMerchants(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
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
  }

  @Get('schools')
  @ApiOperation({ summary: 'Get all schools with user and merchant counts' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of schools to return per page, default is 10',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    description: 'Search term for filtering by school name or school ID',
    type: String,
    example: 'University of Benin',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched schools with user and merchant counts',
    type: [School],
  })
  async getAllSchools(@Query() paginationDto: PaginationDto) {
    const data =
      await this.adminUserDashboardService.getAllSchoolsWithUserCounts(
        paginationDto,
      );
    return successResponse({
      message: 'Successfully fetched schools with user and merchant counts',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('counts/school/:schoolId')
  @ApiOperation({
    summary: 'Get the count of merchants and users in a school or university',
  })
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

  @Get('school/:id/users')
  @ApiOperation({
    summary:
      'Get users (merchant or user) by school ID with optional filters and pagination',
  })
  @ApiQuery({
    name: 'user_type',
    required: true,
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

  @Get('school/merchants-product-invoice-count')
  @ApiOperation({
    summary: 'Get all merchants with product and invoice counts for a school',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    description: 'The ID of the school to filter merchants',
    type: String,
    example: '6ebd279c-4d51-4cd2-b445-76d317aa64c3',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of merchants to return per page (default: 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    description: 'Search term for filtering by merchant name or email',
    type: String,
    example: 'John Doe',
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully fetched merchants with counts of their products and invoices',
    type: [User], // Adjust this type to match your User entity type
  })
  async getAllSchoolMerchants(
    @Query() merchantPaginationDto: MerchantPaginationDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('school_id is required');
    }
    const data =
      await this.adminUserDashboardService.getAllSchoolMerchantsWithCounts(
        merchantPaginationDto,
        schoolId,
      );
    return successResponse({
      message: 'Merchants fetched successfully',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Get('school/users')
  @ApiOperation({
    summary: 'Get all users for a school',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    description: 'The ID of the school to filter users',
    type: String,
    example: '6ebd279c-4d51-4cd2-b445-76d317aa64c3',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of users to return per page (default: 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    description: 'Search term for filtering by users name or email',
    type: String,
    example: 'John Doe',
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully fetched merchants with counts of their products and invoices',
    type: [User], // Adjust this type to match your User entity type
  })
  async getAllSchoolUsers(
    @Query() userPaginationDto: MerchantPaginationDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('school_id is required');
    }

    try {
      const data = await this.adminUserDashboardService.getAllSchoolUser(
        userPaginationDto,
        schoolId,
      );
      return successResponse({
        message: 'Users fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('merchants-product-invoice-count')
  @ApiOperation({
    summary: 'Get all merchants with product and invoice counts',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of merchants to return per page (default: 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    description: 'Search term for filtering by merchant name or email',
    type: String,
    example: 'John Doe',
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully fetched merchants with counts of their products and invoices',
    type: [User], // Adjust this type to match your User entity type
  })
  async getAllMerchants(@Query() merchantPaginationDto: MerchantPaginationDto) {
    try {
      const data =
        await this.adminUserDashboardService.getAllMerchantsWithCounts(
          merchantPaginationDto,
        );
      return successResponse({
        message: 'Merchants fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('merchant-invoices')
  @ApiOperation({
    summary: 'Get product count and filtered invoices for a merchant',
  })
  @ApiQuery({
    name: 'merchantId',
    required: true,
    description: 'ID of the user (merchant)',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Optional search term for filtering invoices by invoice_id',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
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
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Optional start date for filtering invoices',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Optional end date for filtering invoices',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description:
      'Merchant product count and filtered invoices fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch merchant product count and invoices',
  })
  async getMerchantProductAndInvoices(
    @Query('userId') userId: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const stats =
        await this.adminUserDashboardService.getMerchantProductAndInvoices(
          userId,
          search,
          page,
          limit,
          startDate,
          endDate,
        );

      return successResponse({
        message:
          'Merchant product count and filtered invoices fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: stats,
      });
    } catch (error) {
      this.logger.error('Error retrieving category', error.message);
      throw error;
    }
  }

  @Get('category')
  @ApiOperation({
    summary: 'Get all Categories',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of schools to return per page',
    type: Number,
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Categories fetched' })
  async getCategory(@Query() paginationDto: PaginationDto) {
    try {
      const category =
        await this.adminUserDashboardService.findCategory(paginationDto);
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

  @Get('inactive-users')
  @ApiOperation({
    summary: 'Get Users with is_active = false with pagination',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of users per page (default: 10)',
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

  @Put(':id/verify-merchant')
  @ApiOperation({ summary: 'Verify merchant by ID' })
  @ApiResponse({ status: 200, description: 'Merchant verification successful' })
  @ApiResponse({ status: 400, description: 'Unable to verify merchant' })
  async approveProduct(@Param('id') id: string) {
    await this.adminUserDashboardService.verifyMerchant(id);
    return successResponse({
      message: 'Merchant verification successful',
      code: HttpStatus.OK,
      status: 'success',
    });
  }

  @Delete('delete/user')
  @ApiOperation({ summary: `Delete user account with email` })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'email of user',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User account successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'User account not found' })
  @ApiResponse({ status: 401, description: 'Unable to delete user account' })
  async deleteUserAccount(@Body() body: { email: string }) {
    await this.adminUserDashboardService.deleteUserAccount(body.email);
    return successResponse({
      message: 'User account successfully deleted',
      code: HttpStatus.OK,
      status: 'success',
    });
  }

  @Get('/merchant/:merchantId')
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, description: 'Merchant fetched successfully.' })
  @ApiResponse({ status: 404, description: 'No merchant found.' })
  @ApiResponse({ status: 401, description: 'Unable to fetch merchant.' })
  async findMerchantById(@Param('merchantId') merchantId: string) {
    const data =
      await this.adminUserDashboardService.getMerchantDetails(merchantId);
    return successResponse({
      message: 'Merchants fetched successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }
}
