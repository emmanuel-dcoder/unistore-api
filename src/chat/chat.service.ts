import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(payload: { user: string; merchant: string }): Promise<Chat> {
    const { user, merchant } = payload;

    const existingChat = await this.chatRepo.findOne({
      where: { user: { id: user }, merchant: { id: merchant } },
    });

    if (!existingChat) {
      throw new NotFoundException('Chat not found');
    }
    return existingChat;
  }

  async createChatId(payload: {
    user: string;
    merchant: string;
    last_message: string;
  }): Promise<Chat> {
    const { user, merchant, last_message } = payload;

    const existingChat = await this.chatRepo.findOne({
      where: { user: { id: user }, merchant: { id: merchant } },
    });

    if (existingChat) {
      return existingChat;
    }

    return this.chatRepo.save({
      user: { id: user } as any,
      merchant: { id: merchant } as any,
      last_message,
    });
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
      .leftJoinAndSelect('message.chat', 'chat')
      .where('(message.sender.id = :userId1 AND chat.merchant.id = :userId2)', {
        userId1,
        userId2,
      })
      .orWhere('(chat.user.id = :userId1 AND message.sender.id = :userId2)', {
        userId1,
        userId2,
      })
      .orderBy('message.created_at', 'ASC')
      .getMany();
  }
}
