import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { successResponse } from 'src/core/common';

@Controller('api/v1/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() payload: { user: string; merchant: string; last_message: string },
  ) {
    try {
      const data = await this.chatService.createChatId({ ...payload });

      await this.chatService.saveMessage(
        data.id,
        payload.user,
        payload.merchant,
        payload.last_message,
      );

      return successResponse({
        message: `Chat created successfully`,
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('list/:id')
  async getChatList(@Param('id') participant: string) {
    try {
      const data = await this.chatService.getChatsByParticipant(participant);

      return successResponse({
        message: `Chat list fetched`,
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Get('message')
  async getChatMessage(@Body() payload: { user: string; merchant: string }) {
    try {
      const { user, merchant } = payload;
      const data = await this.chatService.getMessages(user, merchant);

      return successResponse({
        message: `Chat Message fetched`,
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
