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
@ApiTags('Notification')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user')
  @ApiOperation({
    summary: 'Get notification message for user and merchant',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch notification',
  })
  async getProductRating(@Req() req: any) {
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
}
