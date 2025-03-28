import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { successResponse } from 'src/core/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('api/v1/chat')
@ApiTags('Real-time Socket Description (Merchants/Users and Merchants/Admin)')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get('participant')
  @ApiOperation({ summary: 'Get all participant chats' })
  @ApiResponse({ status: 200, description: 'Participant chats fetched' })
  @ApiResponse({ status: 401, description: 'Unable to fetch participant chat' })
  @ApiResponse({ status: 404, description: 'No chat currently' })
  async handleGetChats(@Req() req: any) {
    const participant = req.user.id;
    const chats = await this.chatService.getChatsByParticipant(participant);

    return successResponse({
      message:
        chats.length !== 0
          ? `Participant chats fetched`
          : `No active chats currently`,
      code: HttpStatus.OK,
      status: 'success',
      data: chats,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Send a message between merchant and user (via WebSocket)',
    description: `
**Socket Operations**:

1. **Send Message**:
   - **Emit**: \`sendMessage\`
   - **Payload**:
     - \`sender\`: ID of the sender
     - \`receiver\`: ID of the receiver
     - \`message\`: Text content of the chat
     - \`user_type\`: Can be \`merchant\` or \`user\`
     - \`attachment\` (optional): File or attachment
   - **Listen**: \`receiver id\` for real-time updates.

2. **Chat History**:
   - **Emit**: \`getMessages\`
   - **Payload**:
     - \`chat Id\`: id of chat
   - **Listen**: \`messageHistory\` for historical chats.

3. **Chat Participation**:
   - **Emit**: \`getChats\`
   - **Payload**:
     - \`participantId\`: ID of the participant
   - **Listen**: \`chatList\` for the list of participated chats.
`,
  })
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

  @Post('admin')
  @ApiOperation({
    summary: 'Send a message between merchant and admin (via WebSocket)',
    description: `
**Socket Operations**:

1. **Send Message**:
   - **Emit**: \`sendAdminMessage\`
   - **Payload**:
     - \`sender\`: ID of the sender
     - \`receiver\`: ID of the receiver
     - \`message\`: Text content of the chat
     - \`user_type\`: Can be \`merchant\` or \`admin\`
     - \`attachment\` (optional): File or attachment
   - **Listen**: \`receiver id\` for real-time updates.


2. **Chat History**:
   - **Emit**: \`getAdminMessages\`
   - **Payload**:
     - \`chat Id\`: id of chat
   - **Listen**: \`messageHistory\` for historical chats.

3. **Chat Participation**:
   - **Emit**: \`getAdminChats\`
   - **Payload**:
     - \`participantId\`: ID of the participant
   - **Listen**: \`chatList\` for the list of participated chats.
`,
  })
  async sendAdminMessage(
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

  @Get('list/admin/:id')
  @ApiOperation({
    summary: 'Get the list of chats participated in between merchant and admin',
    description: `
**Fetch Chat List**:
- **Endpoint**: \`GET /list/:id\`
- **Parameter**: \`participantId\` - ID of the participant.
- **Returns**: List of chats the participant is involved in.
`,
  })
  @Get('list/:id')
  async getChatList(@Param('id') participant: string) {
    try {
      const data =
        await this.chatService.getAdminChatsByParticipant(participant);

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

  @ApiOperation({
    summary: 'Get the list of chats participated in, between user and merchant',
    description: `
**Fetch Chat List**:
- **Endpoint**: \`GET /list/:id\`
- **Parameter**: \`participantId\` - ID of the participant.
- **Returns**: List of chats the participant is involved in.
`,
  })
  async getAdminChatList(@Param('id') participant: string) {
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
  @ApiOperation({
    summary: 'Fetch chat messages between a user and merchant',
    description: `
**Fetch Chat Messages**:
- **Endpoint**: \`GET /message\`
- **Payload**:
  - \`chatID\`: id of the chat
- **Returns**: Messages exchanged between the specified user and merchant.
`,
  })
  async getChatMessage(@Body() chatId: string) {
    try {
      const data = await this.chatService.getMessages(chatId);

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

  @Get('admin-message')
  @ApiOperation({
    summary: 'Fetch chat messages between a merchant and admin',
    description: `
**Fetch Chat Messages**:
- **Endpoint**: \`GET /message\`
- **Payload**:
  - \`chatID\`: id of the chat
- **Returns**: Messages exchanged between the specified user and merchant.
`,
  })
  async getAdminChatMessage(@Body() chatId: string) {
    try {
      const data = await this.chatService.getAdminMessages(chatId);

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

  //fetch all chats
  @ApiOperation({
    summary: 'Fetch all chats',
  })
  @Get('all')
  async getAllChats() {
    try {
      const data = await this.chatService.getAllChats();

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
