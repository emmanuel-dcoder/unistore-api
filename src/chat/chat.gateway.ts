import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { GetAdminMessagesDto, SendMessageDto } from './dto/create-chat.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { AdminChat } from './entities/admin-chat.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>(); // Map userId to socketId

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @InjectRepository(AdminChat)
    private readonly adminChatRepo: Repository<AdminChat>,
    private readonly chatService: ChatService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.connectedUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) this.connectedUsers.delete(userId);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  registerUser(client: Socket, userId: string) {
    this.connectedUsers.set(userId, client.id);
    console.log(`User registered: ${userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, @MessageBody() payload: SendMessageDto) {
    const { sender, receiver, message, user_type, attachment } = payload;

    if (!sender || !receiver || !message || !user_type) {
      return await this.server.emit(
        `${receiver}`,
        'Sender, receiver, message and user_type are required',
      );
    }

    let user;
    let merchant;
    if (user_type === 'merchant') {
      user = receiver;
      merchant = sender;
    }

    if (user_type === 'user') {
      user = sender;
      merchant = receiver;
    }

    let chat;
    chat = await this.chatRepo.findOne({
      where: { user: { id: user }, merchant: { id: merchant } },
    });

    if (!chat) {
      chat =
        user_type === 'merchant'
          ? await this.chatService.createChatId({
              merchant: sender,
              user: receiver,
              last_message: message,
            })
          : await this.chatService.createChatId({
              merchant: receiver,
              user: sender,
              last_message: message,
            });
    }

    let imageString;
    if (attachment) {
      const image = await this.uploadAttachment(attachment);
      imageString = image.secure_url as string;
    }

    const savedMessage = await this.chatService.saveMessage(
      chat.id as string,
      sender,
      receiver,
      message,
      imageString,
    );

    if (receiver) {
      return await this.server.emit(`${receiver}`, savedMessage);
    }
  }

  @SubscribeMessage('sendAdminMessage')
  async handleAdminMessage(
    client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const { sender, receiver, message, user_type, attachment } = payload;

    // const receiverSocketId = this.connectedUsers.get(receiver);

    if (!sender || !receiver || !message || !user_type) {
      return await this.server.emit(
        `${receiver}`,
        'Sender, receiver, message and user_type are required',
      );
    }

    let admin;
    let merchant;
    if (user_type === 'merchant') {
      admin = receiver;
      merchant = sender;
    }

    if (user_type === 'admin') {
      admin = sender;
      merchant = receiver;
    }

    let chat;
    chat = await this.adminChatRepo.findOne({
      where: { admin: { id: admin }, merchant: { id: merchant } },
    });

    if (!chat) {
      chat =
        user_type === 'merchant'
          ? await this.chatService.createAdminChatId({
              merchant: sender,
              admin: receiver,
              last_message: message,
            })
          : await this.chatService.createAdminChatId({
              merchant: receiver,
              admin: sender,
              last_message: message,
            });
    }

    let imageString;
    let senderType = user_type === 'merchant' ? 'User' : 'Admin';
    if (attachment) {
      const image = await this.uploadAttachment(attachment);
      imageString = image.secure_url as string;
    }

    const savedMessage = await this.chatService.saveAdminMessage(
      chat.id as string,
      sender,
      receiver,
      message,
      senderType,
      imageString,
    );

    if (receiver) {
      return await this.server.emit(`${receiver}`, savedMessage);
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(client: Socket, chatId: string) {
    const messages = await this.chatService.getMessages(chatId);
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('getAdminMessages')
  async handleAdminGetMessages(client: Socket, payload: GetAdminMessagesDto) {
    const { senderType } = payload;

    if (!senderType) {
      client.emit('messageHistory', 'sender type cannot be null');
    }

    if (
      (senderType && senderType !== 'Admin') ||
      (senderType && senderType !== 'User')
    ) {
      client.emit('messageHistory', 'sender type must be either Admin or User');
    }

    const messages = await this.chatService.getAdminMessages(
      payload.admin,
      payload.merchant,
      payload.senderType,
    );

    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('getChats')
  async handleGetChats(client: Socket, participantId: string) {
    try {
      if (!participantId) {
        client.emit('chatList', 'Invalid participant id or no participant id');
      }
      const chats = await this.chatService.getChatsByParticipant(participantId);
      client.emit('chatList', chats);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('getAdminChats')
  async handleAdminGetChats(client: Socket, participantId: string) {
    try {
      if (!participantId) {
        client.emit('chatList', 'Invalid participant id or no participant id');
      }
      const chats =
        await this.chatService.getAdminChatsByParticipant(participantId);
      client.emit('chatList', chats);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private async uploadAttachment(file: Express.Multer.File | undefined) {
    if (!file) {
      return null;
    }
    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      'profile_pictures',
    );
    return uploadedFile.secure_url;
  }
}
