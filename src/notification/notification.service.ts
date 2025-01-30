import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BadRequestErrorException } from 'src/core/common';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto, user: string) {
    try {
      const notification = await this.notificationRepo.create({
        ...createNotificationDto,
        user: { id: user } as any,
      });

      const result = await this.notificationRepo.save(notification);

      if (!result) {
        throw new BadRequestErrorException('Unable to create notification');
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async fetch(userId: string) {
    try {
      const notification = await this.notificationRepo.find({
        where: { user: { id: userId } },
        order: { created_at: 'DESC' },
      });
      return notification;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async fetchAll() {
    try {
      const notification = await this.notificationRepo.find({
        order: { created_at: 'DESC' },
      });

      return notification;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
