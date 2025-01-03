import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { MailService } from 'src/core/mail/email';
import { SchoolService } from 'src/school/school.service';
import { School } from 'src/school/entities/school.entity';
// import { MailService } from 'src/core/mail/email';

@Module({
  imports: [TypeOrmModule.forFeature([User, School])],
  controllers: [UserController],
  providers: [UserService, CloudinaryService, MailService, SchoolService],
})
export class UserModule {}
