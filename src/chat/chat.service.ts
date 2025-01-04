import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createChatId(payload: {
    user: string;
    merchant: string;
    last_message: string;
  }): Promise<Chat> {
    const { user, merchant, last_message } = payload;

    const chat = await this.chatRepo.save({
      user: { id: user } as any,
      merchant: { id: merchant } as any,
      last_message,
    });

    return chat;
  }

  async getChat(id: string): Promise<Chat[]> {
    return await this.chatRepo.find({ where: { id: id } });
  }

  async saveMessage(
    chat: string,
    sender: string,
    receiver: string,
    message: string,
  ): Promise<Message> {
    const chatMessage = await this.messageRepo.save({
      chat: { id: chat } as any,
      sender: { id: sender } as any,
      receiver: { id: receiver } as any,
      message,
    });
    return chatMessage;
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageRepo
      .createQueryBuilder('message')
      .where('(message.sender = :userId1 AND chat.receiver = :userId2)', {
        userId1,
        userId2,
      })
      .orWhere('(chat.sender = :userId2 AND chat.receiver = :userId1)', {
        userId1,
        userId2,
      })
      .orderBy('chat.timestamp', 'ASC')
      .getMany();
  }
}
