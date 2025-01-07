import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Message])],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, CloudinaryService],
})
export class ChatModule {}
