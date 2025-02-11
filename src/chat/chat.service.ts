import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { AdminMessage } from './entities/admin-message.entity';
import { AdminChat } from './entities/admin-chat.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(AdminMessage)
    private readonly adminMessageRepo: Repository<AdminMessage>,
    @InjectRepository(AdminChat)
    private readonly adminChatRepo: Repository<AdminChat>,
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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

  async findOneWithAdmin(payload: {
    admin: string;
    merchant: string;
  }): Promise<AdminChat> {
    const { admin, merchant } = payload;

    const existingChat = await this.adminChatRepo.findOne({
      where: { admin: { id: admin }, merchant: { id: merchant } },
    });

    if (!existingChat) {
      throw new NotFoundException('Admin Chat not found');
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

  async createAdminChatId(payload: {
    admin: string;
    merchant: string;
    last_message: string;
  }): Promise<AdminChat> {
    const { admin, merchant, last_message } = payload;

    const existingChat = await this.adminChatRepo.findOne({
      where: { admin: { id: admin }, merchant: { id: merchant } },
    });

    if (existingChat) {
      existingChat.last_message = last_message;
      await this.chatRepo.save(existingChat);
      return existingChat;
    }

    return this.chatRepo.save({
      admin: { id: admin } as any,
      merchant: { id: merchant } as any,
      last_message,
    });
  }

  async getChat(id: string): Promise<Chat[]> {
    return await this.chatRepo.find({ where: { id: id } });
  }

  async getAdminChat(id: string): Promise<AdminChat[]> {
    return await this.adminChatRepo.find({ where: { id: id } });
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
  async saveAdminMessage(
    chat: string,
    sender: string,
    receiver: string,
    message: string,
    senderType: string,
    attachment?: string,
  ): Promise<AdminMessage> {
    const chatMessage = await this.adminMessageRepo.save({
      chat: { id: chat } as any,
      sender: { id: sender } as any,
      receiver: { id: receiver } as any,
      senderType,
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
  async getAdminMessages(
    admin: string,
    merchant: string,
    senderType: string,
  ): Promise<AdminMessage[]> {
    const messages = await this.adminMessageRepo.find({
      where: [
        {
          sender: merchant,
          senderType,
          chat: { admin: { id: admin } },
        },
        {
          senderType: 'Admin',
          chat: { merchant: { id: merchant } },
        },
      ],
      relations: ['chat', 'chat.merchant', 'chat.admin'], // Exclude 'sender' from relations
      select: {
        id: true,
        message: true,
        attachment: true,
        created_at: true,
        updated_at: true,
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
          admin: {
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

    // Populate the `sender` field dynamically
    const populatedMessages = await Promise.all(
      messages.map(async (message) => {
        let senderDetails;

        if (message.senderType === 'User') {
          senderDetails = await this.userRepo.findOne({
            where: { id: message.sender },
            select: ['id', 'first_name', 'last_name', 'profile_picture'],
          });
        } else if (message.senderType === 'Admin') {
          senderDetails = await this.adminRepo.findOne({
            where: { id: message.sender },
            select: ['id', 'first_name', 'last_name', 'profile_picture'],
          });
        }

        return {
          ...message,
          sender: senderDetails,
        };
      }),
    );

    return populatedMessages;
  }

  async getChatsByParticipant(participantId: string): Promise<Chat[]> {
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user', 'user')
      .leftJoinAndSelect('chat.merchant', 'merchant')
      .where('user.id = :participantId OR merchant.id = :participantId', {
        participantId,
      })
      .orderBy('chat.updated_at', 'DESC')
      .select([
        'chat.id', // Ensure chat ID is included
        'chat.updated_at',
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
        'merchant.id',
        'merchant.first_name',
        'merchant.last_name',
        'merchant.profile_picture',
      ])
      .getMany();

    return chats;
  }

  async getAdminChatsByParticipant(
    participantId: string,
  ): Promise<AdminChat[]> {
    const chats = await this.adminChatRepo.find({
      relations: ['user', 'merchant'],
      where: [
        { admin: { id: participantId } },
        { merchant: { id: participantId } },
      ],
      order: {
        updated_at: 'DESC',
      },
      select: {
        admin: {
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
