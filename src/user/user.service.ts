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
  BadRequestErrorException,
  comparePassword,
  ConflictErrorException,
  generateAccessToken,
  hashPassword,
  NotFoundErrorException,
  RandomFourDigits,
  UnauthorizedErrorException,
} from 'src/core/common';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  VerifyPasswordOtpDto,
} from './dto/reset-password.dto';
import { compare } from 'bcrypt';
import { CreateNewPasswordDto } from './dto/create-new-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/verify-otp.dto.';
import { MailService } from 'src/core/mail/email';
import { NotificationService } from 'src/notification/notification.service';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  /**user dashboard and analysis */
  // Fetch all users with 'merchant' user_type
  async findUsersByType(userType: string): Promise<User[]> {
    return await this.userRepo.find({
      where: { user_type: userType },
      select: [
        'first_name',
        'last_name',
        'user_type',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });
  }

  // Fetch all products where 'featured' is true
  async findFeaturedProducts(schoolId: string): Promise<Product[]> {
    return await this.productRepo.find({
      where: { featured: true, school: { id: schoolId } },
    });
  }

  // Fetch all products
  async findAll(schoolId: string): Promise<Product[]> {
    return await this.productRepo.find({
      where: { school: { id: schoolId } },
    });
  }

  // Fetch categories in descending order by created_at
  async findAllDesc(): Promise<Category[]> {
    return await this.categoryRepo.find({
      order: { created_at: 'DESC' },
    });
  }
  /**end of user dashboard analysis */

  async create(payload: CreateUserDto) {
    const userRecord = await this.userRepo.findOne({
      where: { email: payload.email },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (userRecord) {
      throw new ConflictErrorException('Account with email already exists');
    }
    const otp = RandomFourDigits();
    const hashedPassword = await hashPassword(payload.password);
    payload.password = hashedPassword;
    payload.verification_otp = otp;

    const result = await this.userRepo.save(payload);

    try {
      await this.mailService.sendMailNotification(
        result.email,
        'Welcome to UniStore',
        { name: result.first_name, otp },
        'welcome',
      );

      await this.notificationService.create(
        {
          title: 'Welcome to Unistore',
          message: 'Hello, you welcome to Unistore. Glad to have you here',
        },
        result.id,
      );
    } catch (error) {
      console.log('error:', error);
    }
    delete result.password;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['school'],
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
        'password',
        'user_type',
      ],
    });

    if (!user) {
      throw new UnauthorizedErrorException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedErrorException(
        'User not currently active, kindly verify your account',
      );
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const schoolPayload = user.school
      ? { id: user.school.id, name: user.school.name }
      : null;

    const access_token = generateAccessToken(
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        is_active: user.is_active,
        is_merchant_verified: user.is_merchant_verified,
        school: schoolPayload,
        profile_picture: user.profile_picture,
        user_status: user.user_status,
      },
      'user_access_key',
    );

    return {
      access_token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        profile_picture: user.profile_picture,
        identification: user.identification,
        user_type: user.user_type,
        is_active: user.is_active,
        is_merchant_verified: user.is_merchant_verified,
        school: schoolPayload,
        user_status: user.user_status,
        featured: user.featured,
      },
    };
  }

  async findMerchants(search?: string, schoolId?: string): Promise<any[]> {
    const queryBuilder = this.userRepo.createQueryBuilder('user');

    queryBuilder
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.phone',
        'user.profile_picture',
        'user.is_active',
        'user.featured',
        'user.is_merchant_verified',
        'user.user_type',
        'user.created_at',
      ])
      .where('user.user_type = :userType', { userType: Role.MERCHANT });

    queryBuilder.andWhere('user.school = :schoolId', { schoolId });

    if (search) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('user.created_at', 'DESC');

    const merchants = await queryBuilder.getMany();

    if (!merchants || merchants.length === 0) {
      throw new NotFoundException('No merchants found.');
    }

    return merchants;
  }
  async verifyOtp(payload: { email: string; otp: string }) {
    const { email, otp } = payload;
    const user = await this.userRepo.findOne({
      where: { email },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
        'verification_otp',
        'created_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpExpiryLimit = 60 * 5000;
    const otpCreationTime = user.created_at.getTime();
    const currentTime = Date.now();

    if (currentTime - otpCreationTime > otpExpiryLimit) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.verification_otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    user.is_active = true;
    await this.userRepo.save(user);

    try {
      await this.mailService.sendMailNotification(
        user.email,
        'OTP Verification',
        { name: user.first_name },
        'otp_verified',
      );

      await this.notificationService.create(
        {
          title: 'OTP Verification',
          message: 'Hi, your account is now verified',
        },
        user.id,
      );
    } catch (error) {
      console.log('error:', error);
    }

    return { message: 'OTP verified successfully' };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.userRepo.findOne({
      where: { email },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = RandomFourDigits();
    const otpCreationTime = new Date();
    user.verification_otp = otp;
    user.created_at = otpCreationTime;

    await this.userRepo.save(user);

    try {
      await this.mailService.sendMailNotification(
        user.email,
        'OTP Resent',
        { otp },
        'otp_resend',
      );
    } catch (error) {
      console.log('error:', error);
    }

    return { message: 'OTP has been resent successfully' };
  }

  async update(id: string, updateUserDto: Partial<UpdateUserDto>) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = { ...user, ...updateUserDto };

    return await this.userRepo.save(updatedUser);
  }

  async updateSchool(id: string, updateUserSchoolDto: UpdateUserSchoolDto) {
    const existingUser = await this.userRepo.findOne({
      where: { id },
    });

    if (existingUser && existingUser.id !== id) {
      throw new BadRequestException('Email is already in use by another user.');
    }

    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
      relations: ['school'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserSchoolDto);

    return await this.userRepo.save(user);
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadedFile = await this.uploadUserImage(file);
    user.profile_picture = uploadedFile;

    await this.userRepo.save(user);

    return {
      message: 'Profile picture uploaded successfully',
      profile_picture: uploadedFile,
    };
  }

  async photoIdentification(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadedFile = await this.uploadUserImage(file);
    user.identification = uploadedFile;

    await this.userRepo.save(user);

    return {
      message: 'Photo-identification uploaded successfully',
      identification: uploadedFile,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = RandomFourDigits();
    user.reset_token = resetToken;
    user.reset_token_created_at = new Date();

    await this.userRepo.save(user);

    await this.mailService.sendMailNotification(
      user.email,
      'Password Reset Request',
      { name: user.first_name, reset_token: resetToken },
      'reset-password', // Email template
    );

    return { message: 'Password reset link sent to email' };
  }

  async verifyPasswordOtp(resetPasswordDto: VerifyPasswordOtpDto) {
    const { reset_token, email } = resetPasswordDto;

    // Find user by reset token
    const user = await this.userRepo.findOne({
      where: { reset_token, email },
    });

    if (!user) {
      throw new NotFoundException('Invalid reset token');
    }

    const tokenAge =
      (new Date().getTime() - new Date(user.reset_token_created_at).getTime()) /
      5000;

    // Check if token expired (1 minute)
    if (tokenAge > 60) {
      throw new ConflictException('Reset token expired');
    }

    user.reset_token = null;

    await this.userRepo.save(user);

    return { message: 'Otp verification successful' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, new_password } = resetPasswordDto;

    const user = await this.userRepo.findOne({
      where: { email, reset_token: null },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found or token likely not verified',
      );
    }

    const hashedPassword = await hashPassword(new_password);
    user.password = hashedPassword;

    await this.userRepo.save(user);

    return { message: 'Password successfully reset' };
  }

  async updatePassword(createNewPasswordDto: CreateNewPasswordDto) {
    const { old_password, new_password } = createNewPasswordDto;

    const user = await this.userRepo.findOne({
      where: { email: 'user@example.com' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestErrorException('User not found');
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestErrorException('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new BadRequestErrorException(
        'New password must be between 6 and 20 characters',
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;

    await this.userRepo.save(user);

    return { message: 'Password updated successfully' };
  }

  async getCurrentUser(userId: string): Promise<User | undefined> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });
    if (!user) throw new NotFoundErrorException('User not found');

    return user;
  }

  async find() {
    const user = await this.userRepo.find({
      select: [
        'first_name',
        'last_name',
        'phone',
        'id',
        'profile_picture',
        'is_active',
        'is_merchant_verified',
        'email',
        'identification',
        'user_status',
      ],
    });

    if (!user) {
      throw new NotFoundException('Unable to find user');
    }

    return user;
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

  async deleteUserByEmail(email: string): Promise<{ message: string }> {
    const result = await this.userRepo.delete({ email });

    if (result.affected === 0) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    return {
      message: `User with email ${email} has been deleted successfully.`,
    };
  }
}
