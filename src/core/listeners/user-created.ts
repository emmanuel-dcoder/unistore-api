// import { Injectable, Logger } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { EVENTS } from '../../events';
// import { EmailVerification } from 'src/auth/entity/verification';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from 'src/users/entity/user.entity';
// import { MailService } from 'src/mail/mail.service';
// import { UserDto } from 'src/users/dto/user.dto';
// import { UserCreatedEvent } from '../events/user-created.event';

// @Injectable()
// export class UserCreatedListener {
//   private readonly logger = new Logger(UserCreatedListener.name);

//   constructor(
//     @InjectRepository(EmailVerification)
//     private readonly emailVerificationRepo: Repository<EmailVerification>,
//     private mailService: MailService,
//   ) {}

//   @OnEvent(EVENTS.USER_CREATED)
//   async execute(event: UserCreatedEvent) {
//     try {
//       const user = event.user;
//       const otp = await this.createEmailVerification(user);
//       const userDto = UserDto.fromEntity(user);
//       const context = {
//         user: userDto,
//         otp,
//       };
//       await this.mailService.sendEmail(
//         event.subject,
//         event.template,
//         context,
//         userDto,
//       );
//     } catch (error) {
//       this.logger.error(error);
//       throw error;
//     }
//   }

//   private async createEmailVerification(user: User): Promise<string> {
//     const verification = new EmailVerification();
//     verification.user = user;
//     verification.expires_at = new Date(Date.now() + 60 * 60 * 1000);
//     const rawCode = verification.generate_code();
//     await verification.hash_generated_code(rawCode);
//     await this.emailVerificationRepo.save(verification);
//     return rawCode;
//   }
// }
