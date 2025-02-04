import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  Put,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  Get,
  Req,
  BadRequestException,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateBankDto,
  UpdateUserRoleDto,
  UpdateUserSchoolDto,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  VerifyPasswordOtpDto,
} from './dto/reset-password.dto';
import {
  CreateNewPasswordDto,
  PasswordUserChangeDto,
} from './dto/create-new-password.dto';
import { LoginDto } from './dto/login.dto';
import {
  BadRequestErrorException,
  successResponse,
  SuccessResponseType,
} from 'src/core/common';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto.';
import { SchoolService } from 'src/school/school.service';
import { InvoiceService } from 'src/invoice/service/invoice.service';
import { MerchantGuard } from 'src/core/guards/merchant.guard';
import { UserGuard } from 'src/core/guards/user.guard';

@Controller('api/v1/user')
@ApiTags('User')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(
    private readonly userService: UserService,
    private readonly schoolService: SchoolService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @UseGuards(MerchantGuard)
  @Get('merchant/dashboard')
  @ApiOperation({
    summary: 'Get merchant dashboard with analysis',
  })
  @ApiResponse({ status: 200, description: 'Data fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMerchantDashboardData(
    @Req() req: any,
  ): Promise<SuccessResponseType> {
    try {
      const userId = req.user.id;

      const merchantAnalysis =
        await this.invoiceService.getMerchantAnalysis(userId);

      let limit = 5;
      const invoice =
        await this.invoiceService.getInvoicesByProductOwnerWithSearch(
          userId,
          '',
          limit,
        );

      return successResponse({
        message: 'Dashboard data fetched successfully',
        code: 200,
        status: 'success',
        data: {
          merchantAnalysis,
          invoice: invoice,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      throw error;
    }
  }

  @UseGuards(UserGuard)
  @Get('dashboard')
  @ApiOperation({
    summary:
      'Dashboard: Get categories, featured products, all products, and  users',
  })
  @ApiResponse({ status: 200, description: 'Data fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getDashboardData(@Req() req: any): Promise<SuccessResponseType> {
    try {
      const schoolId = req.user?.school?.id;

      const categories = await this.userService.findAllDesc();

      const featuredProducts =
        await this.userService.findFeaturedProducts(schoolId);

      const allProducts = await this.userService.findAll(schoolId);

      const merchantUsers = await this.userService.findUsersByType('merchant');

      return successResponse({
        message: 'Dashboard data fetched successfully',
        code: 200,
        status: 'success',
        data: {
          categories,
          featuredProducts,
          allProducts,
          merchantUsers,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      throw error;
    }
  }

  @Post('')
  @ApiOperation({ summary: 'Create User' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User created successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unable to create user' })
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const data = await this.userService.create(createUserDto);
      return successResponse({
        message: 'User created successfully',
        code: HttpStatus.CREATED,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error creating user', error.message);
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and return JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const data = await this.userService.login(loginDto);
      return successResponse({
        message: 'Login successful',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('logged-in')
  @ApiOperation({
    summary: 'Get current logged in user, send jwt token to get user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in user fetched',
  })
  @ApiResponse({ status: 401, description: 'Unable to fetch user' })
  async getCurrentUser(@Req() req: any): Promise<SuccessResponseType> {
    try {
      if (!req.user.id)
        throw new BadRequestErrorException('this route is authenticated');
      const userId = req.user.id;
      const data = await this.userService.getCurrentUser(userId);
      return successResponse({
        message: 'Login successful',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('/merchant/:merchantId')
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, description: 'Merchant fetched successfully.' })
  @ApiResponse({ status: 404, description: 'No merchant found.' })
  @ApiResponse({ status: 401, description: 'Unable to fetch merchant.' })
  async findMerchantById(@Param('merchantId') merchantId: string) {
    const data = await this.userService.findMerchantById(merchantId);
    return successResponse({
      message: 'Merchants fetched successfully.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @UseGuards(UserGuard)
  @Get('/merchants')
  @ApiOperation({ summary: 'Get all merchants' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Optional search parameter to filter merchants by first name, last name, or email. For example, providing "john" will match merchants with "john" in their name or email.',
  })
  @ApiResponse({ status: 200, description: 'Merchants fetched successfully.' })
  @ApiResponse({ status: 404, description: 'No merchants found.' })
  @ApiResponse({ status: 401, description: 'Unable to fetch merchants.' })
  async findMerchants(@Req() req: any, @Query('search') search?: string) {
    try {
      const schoolId = req.user.school.id;
      const data = await this.userService.findMerchants(search, schoolId);

      return successResponse({
        message: 'Merchants fetched successfully.',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for user' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 400, description: 'Invalid OTP or OTP expired' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      await this.userService.verifyOtp(verifyOtpDto);
      return successResponse({
        message: 'OTP verified successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('OTP verification failed', error.message);
      throw error;
    }
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to user' })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP has been resent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    try {
      await this.userService.resendOtp(resendOtpDto);
      return successResponse({
        message: 'OTP has been resent successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Resend OTP failed', error.message);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const result = await this.userService.update(id, updateUserDto);
      return successResponse({
        message: 'User updated successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Update user failed', error.message);
      throw error;
    }
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update user roles e.g merchant, user' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    try {
      await this.userService.update(id, updateUserRoleDto);
      return successResponse({
        message: 'Role updated successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Update user failed', error.message);
      throw error;
    }
  }

  @Put(':id/school')
  @ApiOperation({
    summary: 'Update user school. the id of the school must be in the body',
  })
  @ApiBody({ type: UpdateUserSchoolDto })
  @ApiResponse({ status: 200, description: 'School added successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateSchool(
    @Param('id') id: string,
    @Body() updateUserSchoolDto: UpdateUserSchoolDto,
  ) {
    try {
      //school
      const { school } = updateUserSchoolDto;
      await this.schoolService.findOne(school);
      await this.userService.updateSchool(id, updateUserSchoolDto);
      return successResponse({
        message: 'School updated successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Update user failed', error.message);
      throw error;
    }
  }

  @Put(':id/profile-picture')
  @ApiOperation({
    summary: 'Upload profile picture for the user, use form data (Key: file)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file)
        throw new BadRequestException(
          'Image file not upload, format must be JPEG/JPG',
        );
      const data = await this.userService.uploadProfilePicture(userId, file);
      return successResponse({
        message: 'Profile picture uploaded successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Upload profile picture failed', error.message);
      throw error;
    }
  }

  @Put(':id/photo-identification')
  @ApiOperation({
    summary:
      'Upload Photo-identification  picture for the user, use form data (Key: file)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Photo-identification uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async photoIdentification(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file)
        throw new BadRequestException(
          'Image file not upload, format must be JPEG/JPG',
        );

      const data = await this.userService.photoIdentification(userId, file);
      return successResponse({
        message: 'Photo-identification uploaded successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Upload profile picture failed', error.message);
      throw error;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      await this.userService.forgotPassword(forgotPasswordDto);
      return successResponse({
        message: 'Password reset link sent successfully.',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Post('verify-password-otp')
  @ApiOperation({
    summary: 'Verify password reset otp, provide the email during verification',
  })
  @ApiBody({ type: VerifyPasswordOtpDto })
  @ApiResponse({ status: 200, description: 'Otp verification successful.' })
  @ApiResponse({ status: 404, description: 'Invalid reset token.' })
  @ApiResponse({ status: 409, description: 'Reset token expired.' })
  async verifyPassword(@Body() verifyPasswordDto: VerifyPasswordOtpDto) {
    try {
      await this.userService.verifyPasswordOtp(verifyPasswordDto);
      return successResponse({
        message: 'Otp verification successful',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password by providing email and password',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully reset.' })
  @ApiResponse({
    status: 404,
    description: 'User not found or token likely not verified',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.userService.resetPassword(resetPasswordDto);
      return successResponse({
        message: 'Password successfully reset.',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Put('update-password')
  @ApiOperation({ summary: "Update the user's password" })
  @ApiBody({ type: CreateNewPasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'Old password is incorrect.' })
  async updatePassword(@Body() createNewPasswordDto: CreateNewPasswordDto) {
    try {
      await this.userService.updatePassword(createNewPasswordDto);
      return successResponse({
        message: 'Password successfully updated.',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: PasswordUserChangeDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect or passwords do not match',
    schema: {
      example: {
        message: 'Current password is incorrect',
      },
    },
  })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: PasswordUserChangeDto,
  ) {
    try {
      if (!req.user.id) {
        throw new BadRequestErrorException('User not authenticated');
      }

      const { currentPassword, newPassword, confirmPassword } =
        changePasswordDto;

      if (newPassword !== confirmPassword) {
        throw new BadRequestErrorException(
          'New password and confirm password do not match',
        );
      }

      const userId = req.user.id;
      const result = await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      return successResponse({
        message: 'Password changed successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: result,
      });
    } catch (error) {
      this.logger.error('Error changing password', error.message);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get  all users' })
  @ApiResponse({ status: 200, description: 'Users fetched.' })
  @ApiResponse({ status: 401, description: 'Unable to fetch users' })
  async find() {
    const data = await this.userService.find();
    return successResponse({
      message: 'Users fetched.',
      code: HttpStatus.OK,
      status: 'success',
      data,
    });
  }

  @Delete()
  async deleteUserByEmail(@Body() deleteUserDto: { email: string }) {
    const { email } = deleteUserDto;
    return await this.userService.deleteUserByEmail(email);
  }

  @Get('bank-list')
  @ApiOperation({ summary: 'Get List of banks' })
  @ApiResponse({ status: 200, description: 'List of bank retrieved' })
  @ApiResponse({ status: 401, description: 'Unable to fetch bank list' })
  async bankList() {
    const data = await this.userService.getBankAccount();
    return successResponse({
      message: 'List of banks retrieved',
      code: HttpStatus.OK,
      status: 'success',
      data: data.data,
    });
  }

  //update banks details
  @Put('/bank/:id')
  @ApiOperation({ summary: 'Update user bank details' })
  @ApiResponse({
    status: 200,
    description: 'Bank details updated successfully',
  })
  @ApiBody({ type: UpdateBankDto })
  @ApiResponse({ status: 404, description: 'Unable to update bank details' })
  async updateBankDetails(
    @Param('id') id: string,
    @Body() updateBankDto: UpdateBankDto,
  ) {
    const data = await this.userService.updateBankDetails(id, updateBankDto);
    return successResponse({
      message: 'Bank details updated successfully',
      code: HttpStatus.OK,
      status: 'success',
      data: {
        bank_account_name: data.bank_account_name,
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
      },
    });
  }
}
