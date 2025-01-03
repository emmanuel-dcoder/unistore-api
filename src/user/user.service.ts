import { UpdateUserDto } from './dto/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserSchoolDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import {
  comparePassword,
  ConflictErrorException,
  generateAccessToken,
  hashPassword,
  RandomFourDigits,
} from 'src/core/common';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { compare } from 'bcrypt';
import { CreateNewPasswordDto } from './dto/create-new-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/verify-otp.dto.';
import { MailService } from 'src/core/mail/email';
import { SchoolService } from 'src/school/school.service';
import { UpdateSchoolDto } from 'src/school/dto/update-school.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async create(payload: CreateUserDto) {
    const userRecord = await this.userRepo.findOne({
      where: { email: payload.email },
    });

    if (userRecord) {
      throw new ConflictErrorException('Account with email already exists');
    }
    const otp = RandomFourDigits();
    const hashedPassword = await hashPassword(payload.password);
    payload.password = hashedPassword;
    payload.verification_otp = otp;

    const result = await this.userRepo.save(payload);

    await this.mailService.sendMailNotification(
      result.email,
      'Welcome to UniStore',
      { name: result.first_name, otp },
      'welcome',
    );
    delete result.password;
    return result;
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find the user by email and populate the school relation
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['school'], // Ensure the school relation is fetched
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extract school details to include in the token
    const schoolPayload = user.school
      ? { id: user.school.id, name: user.school.name }
      : null;

    // Generate JWT
    const access_token = generateAccessToken(
      {
        id: user.id,
        user_type: user.user_type,
        school: schoolPayload, // Include only necessary fields
      },
      'user_access_key',
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
      },
    };
  }

  async verifyOtp(payload: { email: string; otp: string }) {
    const { email, otp } = payload;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpExpiryLimit = 60 * 1000;
    const otpCreationTime = user.created_at.getTime();
    const currentTime = Date.now();

    // Check if OTP is expired
    if (currentTime - otpCreationTime > otpExpiryLimit) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.verification_otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    user.is_active = true;
    await this.userRepo.save(user);

    return { message: 'OTP verified successfully' };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = RandomFourDigits();
    const otpCreationTime = new Date();
    user.verification_otp = otp;
    user.created_at = otpCreationTime;

    await this.userRepo.save(user);

    // Optionally, you can send the OTP to the user via email here (use mail service)
    await this.mailService.sendMailNotification(
      user.email,
      'OTP Resent',
      { otp }, // Send OTP to the user
      'otp_resend',
    );

    return { message: 'OTP has been resent successfully' };
  }

  async update(id: string, updateUserDto: Partial<UpdateUserDto>) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log('updateUserDto', updateUserDto);
    // Merge existing user data with the new data
    const updatedUser = { ...user, ...updateUserDto };

    // Save the updated user
    return await this.userRepo.save(updatedUser);
  }

  async updateSchool(id: string, updateUserSchoolDto: UpdateUserSchoolDto) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge other properties from the DTO
    Object.assign(user, updateUserSchoolDto);

    // Save the updated user
    return await this.userRepo.save(user);
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadedFile = await this.uploadUserImage(file);
    user.profile_picture = uploadedFile.url;

    await this.userRepo.save(user);

    return {
      message: 'Profile picture uploaded successfully',
      profile_picture: uploadedFile.url,
    };
  }

  async photoIdentification(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadedFile = await this.uploadUserImage(file);
    user.identification = uploadedFile.url;

    await this.userRepo.save(user);

    return {
      message: 'Photo-identification uploaded successfully',
      profile_picture: uploadedFile.url,
    };
  }

  // Forgot password: generate OTP and send to email
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = RandomFourDigits(); // You can replace with JWT or any token
    user.reset_token = resetToken;
    user.reset_token_created_at = new Date(); // Save the token's creation time

    await this.userRepo.save(user);

    // Send the token via email to the user (Make sure mail service is implemented)
    await this.mailService.sendMailNotification(
      user.email,
      'Password Reset Request',
      { name: user.first_name, reset_token: resetToken },
      'reset-password', // Email template
    );

    return { message: 'Password reset link sent to email' };
  }

  // Reset password: Check token validity and update password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { reset_token, new_password } = resetPasswordDto;

    // Find user by reset token
    const user = await this.userRepo.findOne({
      where: { reset_token },
    });

    if (!user) {
      throw new NotFoundException('Invalid reset token');
    }

    const tokenAge =
      (new Date().getTime() - new Date(user.reset_token_created_at).getTime()) /
      1000;

    // Check if token expired (1 minute)
    if (tokenAge > 60) {
      throw new ConflictException('Reset token expired');
    }

    // Hash the new password and save
    const hashedPassword = await hashPassword(new_password);
    user.password = hashedPassword;
    user.reset_token = null; // Clear reset token after use

    await this.userRepo.save(user);

    return { message: 'Password successfully reset' };
  }

  // Update password: Update current password with new password
  async updatePassword(createNewPasswordDto: CreateNewPasswordDto) {
    const { old_password, new_password } = createNewPasswordDto;

    // Find user (assume user is already authenticated, use current logged-in user)
    const user = await this.userRepo.findOne({
      where: { email: 'user@example.com' }, // Replace with actual user fetching logic
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if old password matches
    const isOldPasswordCorrect = await comparePassword(
      old_password,
      user.password,
    );
    if (!isOldPasswordCorrect) {
      throw new ConflictException('Old password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(new_password);
    user.password = hashedPassword;

    await this.userRepo.save(user);

    return { message: 'Password successfully updated' };
  }

  private async uploadUserImage(file: Express.Multer.File | undefined) {
    if (!file) {
      return null;
    }
    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      'profile_pictures',
    );
    return uploadedFile.url;
  }

  async find() {
    const user = await this.userRepo.find();

    if (!user) {
      throw new NotFoundException('Unable to find user');
    }

    return user;
  }
}
