import { Injectable, NotFoundException } from '@nestjs/common';
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
      existingChat.last_message = last_message;
      await this.chatRepo.save(existingChat);
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
    attachment?: string,
  ): Promise<Message> {
    const chatMessage = await this.messageRepo.save({
      chat: { id: chat } as any,
      sender: { id: sender } as any,
      receiver: { id: receiver } as any,
      message,
      attachment,
    });
    return chatMessage;
  }
  async getMessages(user: string, merchant: string): Promise<Message[]> {
    const message = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.chat', 'chat')
      .leftJoinAndSelect('message.sender', 'sender')
      .addSelect([
        'sender.id',
        'sender.first_name',
        'sender.last_name',
        'sender.profile_picture',
      ])
      .leftJoinAndSelect('chat.user', 'chatUser')
      .addSelect([
        'chatUser.id',
        'chatUser.first_name',
        'chatUser.last_name',
        'chatUser.profile_picture',
      ])
      .leftJoinAndSelect('chat.merchant', 'chatMerchant')
      .addSelect([
        'chatMerchant.id',
        'chatMerchant.first_name',
        'chatMerchant.last_name',
        'chatMerchant.profile_picture',
      ])
      .where('(message.sender.id = :user AND chat.merchant.id = :merchant)', {
        user,
        merchant,
      })
      .orWhere('(chat.user.id = :user AND message.sender.id = :merchant)', {
        user,
        merchant,
      })
      .orderBy('message.created_at', 'ASC')
      .getMany();

    return message;
  }

  async getChatsByParticipant(participantId: string): Promise<Chat[]> {
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user', 'user')
      .addSelect([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
      ])
      .leftJoinAndSelect('chat.merchant', 'merchant')
      .addSelect([
        'merchant.id',
        'merchant.first_name',
        'merchant.last_name',
        'merchant.profile_picture',
      ])
      .where('user.id = :participantId', { participantId })
      .orWhere('merchant.id = :participantId', { participantId })
      .orderBy('chat.updated_at', 'DESC')
      .getMany();

    if (!chats || chats.length === 0) {
      throw new NotFoundException('No chats found for this participant.');
    }

    return chats;
  }
}
