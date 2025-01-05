import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  Logger,
  Put,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangePasswordDto, CreateAdminDto } from '../dto/create-admin.dto';
import { successResponse, SuccessResponseType } from 'src/core/common';
import { LoginDto } from 'src/user/dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateAdminDto } from '../dto/update-admin.dto';

@ApiTags('Admin Profile')
@Controller('api/v1/admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly adminService: AdminService) {}

  @Post('')
  @ApiOperation({ summary: 'Create Admin' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Admin created successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unable to create admin' })
  async create(@Body() createUserDto: CreateAdminDto) {
    try {
      const data = await this.adminService.create(createUserDto);
      return successResponse({
        message: 'Admin created successfully',
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
      const data = await this.adminService.login(loginDto);
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

  @Put(':id/profile-picture')
  @ApiOperation({
    summary: 'Upload profile picture for the admin, use form data (Key: file)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id') adminId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      await this.adminService.uploadProfilePicture(adminId, file);
      return successResponse({
        message: 'Profile picture uploaded successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Upload profile picture failed', error.message);
      throw error;
    }
  }

  @Get('logged-in')
  @ApiOperation({
    summary: 'Get current logged in admin, send jwt token to get admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in admin fetched',
  })
  @ApiResponse({ status: 401, description: 'Unable to fetch admin' })
  async getCurrentUser(@Req() req: any): Promise<SuccessResponseType> {
    try {
      if (!req.user.id)
        throw new BadRequestException('this route is authenticated');
      const adminId = req.user.id;
      const data = await this.adminService.getCurrentAdmin(adminId);
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

  @Put('change-password')
  @ApiOperation({ summary: 'Change password for the logged-in admin' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    try {
      const adminId = req.user.id; // Ensure the route is protected by middleware to get the logged-in admin
      await this.adminService.changePassword(adminId, changePasswordDto);
      return successResponse({
        message: 'Password updated successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error changing password', error.message);
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Get admin(s) with optional search criteria' })
  @ApiResponse({
    status: 200,
    description: 'Admin(s) retrieved successfully',
  })
  async getAdmins(
    @Query('email') email?: string,
    @Query('username') username?: string,
  ): Promise<SuccessResponseType> {
    try {
      const admins = await this.adminService.getAdmins({ email, username });
      return successResponse({
        message: 'Admin(s) retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: admins,
      });
    } catch (error) {
      this.logger.error('Error fetching admins', error.message);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a single admin by ID' })
  @ApiResponse({
    status: 200,
    description: 'Admin updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
  })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto, // Replace with a DTO class if defined
  ): Promise<SuccessResponseType> {
    try {
      const updatedAdmin = await this.adminService.updateAdmin(
        id,
        updateAdminDto,
      );
      return successResponse({
        message: 'Admin updated successfully',
        data: updatedAdmin,
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error updating admin', error.message);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single admin by ID' })
  @ApiResponse({
    status: 200,
    description: 'Admin deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
  })
  async deleteAdmin(@Param('id') id: string): Promise<SuccessResponseType> {
    try {
      await this.adminService.deleteAdmin(id);
      return successResponse({
        message: 'Admin deleted successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error deleting admin', error.message);
      throw error;
    }
  }
}
