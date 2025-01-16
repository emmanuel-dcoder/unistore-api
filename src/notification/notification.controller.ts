import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Logger,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('api/v1/notification')
@ApiTags('Notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user')
  @ApiOperation({
    summary: 'Get notification message for logged in user and merchant',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch notification',
  })
  async fetch(@Req() req: any) {
    try {
      const user = req.user.id;
      const notification = await this.notificationService.fetch(user);
      return successResponse({
        message: 'Notification fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: notification,
      });
    } catch (error) {
      this.logger.error('Error fetching notification:', error.message);
      throw error;
    }
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch notifications',
  })
  async fetchAll() {
    try {
      const notification = await this.notificationService.fetchAll();
      return successResponse({
        message: 'Notification fetched successfully',
        code: HttpStatus.OK,
        status: 'success',
        data: notification,
      });
    } catch (error) {
      this.logger.error('Error fetching notification:', error.message);
      throw error;
    }
  }
}
