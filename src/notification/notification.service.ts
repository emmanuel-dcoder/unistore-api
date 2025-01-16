import { Injectable } from '@nestjs/common';
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
    const notification = await this.notificationRepo.create({
      ...createNotificationDto,
      user: { id: user } as any,
    });

    const result = await this.notificationRepo.save(notification);

    if (!result) {
      throw new BadRequestErrorException('Unable to create notification');
    }
    return result;
  }

  async fetch(userId: string) {
    const notification = await this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
    });

    return notification;
  }
}
