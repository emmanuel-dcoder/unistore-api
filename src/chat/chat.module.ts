import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { AdminService } from 'src/admin/services/admin.service';
import { Admin } from 'src/admin/entities/admin.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { AdminMessage } from './entities/admin-message.entity';
import { AdminChat } from './entities/admin-chat.entity';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      Message,
      Admin,
      User,
      AdminMessage,
      AdminChat,
      Notification,
      Category,
      Product,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    CloudinaryService,
    AdminService,
    UserService,
    MailService,
    NotificationService,
  ],
})
export class ChatModule {}
