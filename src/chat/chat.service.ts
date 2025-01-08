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
    const messages = await this.messageRepo.find({
      where: [
        {
          sender: { id: user },
          chat: { merchant: { id: merchant } },
        },
        {
          sender: { id: merchant },
          chat: { user: { id: user } },
        },
      ],
      relations: ['chat', 'chat.merchant', 'chat.user', 'sender'],
      select: {
        id: true,
        message: true,
        attachment: true,
        created_at: true,
        updated_at: true,
        sender: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
        chat: {
          id: true,
          last_message: true,
          created_at: true,
          updated_at: true,
          merchant: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          },
          user: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          },
        },
      },
      order: {
        created_at: 'ASC',
      },
    });

    return messages;
  }

  async getChatsByParticipant(participantId: string): Promise<Chat[]> {
    const chats = await this.chatRepo.find({
      relations: ['user', 'merchant'],
      where: [
        { user: { id: participantId } },
        { merchant: { id: participantId } },
      ],
      order: {
        updated_at: 'DESC',
      },
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
        merchant: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
      },
    });

    return chats;
  }
}
