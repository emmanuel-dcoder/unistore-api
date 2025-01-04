import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>(); // Map userId to socketId

  constructor(private readonly chatService: ChatService) {}

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
  async handleMessage(
    client: Socket,
    payload: {
      sender: string;
      receiver: string;
      message: string;
      user_type: string;
    },
  ) {
    const { sender, receiver, message, user_type } = payload;

    //check and create chat id
    const chat =
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

    // Save message to the database
    const savedMessage = await this.chatService.saveMessage(
      chat.id as string,
      sender,
      receiver,
      message,
    );

    // Emit message to the receiver if online
    const receiverSocketId = this.connectedUsers.get(receiver);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receiveMessage', savedMessage);
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    client: Socket,
    payload: { userId1: string; userId2: string },
  ) {
    const messages = await this.chatService.getMessages(
      payload.userId1,
      payload.userId2,
    );
    client.emit('messageHistory', messages);
  }
}
