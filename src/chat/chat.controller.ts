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
     - \`user\`: User ID
     - \`merchant\`: Merchant ID
   - **Listen**: \`messageHistory\` for historical chats.

3. **Chat Participation**:
   - **Emit**: \`getChats\`
   - **Payload**:
     - \`participantId\`: ID of the participant
   - **Listen**: \`chatList\` for the list of participated chats.
`,
  })
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
     - \`admin\`: Admin ID
     - \`merchant\`: Merchant ID
     - \`senderType\`: Can be \`Admin\` or \`User\`
   - **Listen**: \`messageHistory\` for historical chats.

3. **Chat Participation**:
   - **Emit**: \`getAdminChats\`
   - **Payload**:
     - \`participantId\`: ID of the participant
   - **Listen**: \`chatList\` for the list of participated chats.
`,
  })
  @Post('admin')
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

  @ApiOperation({
    summary: 'Get the list of chats participated in',
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

  @ApiOperation({
    summary: 'Fetch chat messages between a user and merchant',
    description: `
**Fetch Chat Messages**:
- **Endpoint**: \`GET /message\`
- **Payload**:
  - \`user\`: User ID
  - \`merchant\`: Merchant ID
- **Returns**: Messages exchanged between the specified user and merchant.
`,
  })
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
