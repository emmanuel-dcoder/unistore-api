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
import { GetMessagesDto, SendMessageDto } from './dto/create-chat.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { BadRequestException } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>(); // Map userId to socketId

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
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

    const receiverSocketId = this.connectedUsers.get(receiver);

    if (!sender || !receiver || message || user_type) {
      return await this.server
        .to(receiverSocketId)
        .emit(
          'receiveMessage',
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
      imageString = image.url as string;
    }

    const savedMessage = await this.chatService.saveMessage(
      chat.id as string,
      sender,
      receiver,
      message,
      imageString,
    );

    if (receiverSocketId) {
      return await this.server
        .to(receiverSocketId)
        .emit('receiveMessage', savedMessage);
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(client: Socket, payload: GetMessagesDto) {
    const messages = await this.chatService.getMessages(
      payload.user,
      payload.merchant,
    );
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('getChats')
  async handleGetChats(client: Socket, participantId: string) {
    try {
      const chats = await this.chatService.getChatsByParticipant(participantId);
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
    return uploadedFile.url;
  }
}
