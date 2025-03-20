import { UpdateUserDto } from './dto/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  UpdateBankDto,
  UpdateUserSchoolDto,
} from './dto/create-user.dto';
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
import { FlutterwaveService } from 'src/core/flutterwave/flutterwave';

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
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  /**user dashboard and analysis */
  // Fetch all users with 'merchant' user_type
  async findUsersByType(userType: string): Promise<User[]> {
    try {
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
          'contact_count',
          'school',
        ],
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // find user by id
  async findById(userId: string): Promise<any> {
    try {
      return await this.userRepo.findOne({
        where: { id: userId },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // Fetch all products where 'featured' is true
  async findFeaturedProducts(schoolId: string): Promise<Product[]> {
    try {
      return await this.productRepo.find({
        where: { featured: true, school: { id: schoolId } },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // Fetch all products
  async findAll(schoolId: string): Promise<Product[]> {
    try {
      return await this.productRepo.find({
        where: { school: { id: schoolId } },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  // Fetch categories in descending order by created_at
  async findAllDesc(): Promise<Category[]> {
    try {
      return await this.categoryRepo.find({
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
  /**end of user dashboard analysis */

  async create(payload: CreateUserDto) {
    try {
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
          'contact_count',
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
          'Welcome',
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
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
        throw new NotFoundException('User not found');
      }

      if (!user.is_active) {
        throw new UnauthorizedErrorException(
          'User not currently active, kindly verify your account',
        );
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid email or password');
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findMerchantById(merchantId: string) {
    try {
      const merchant = await this.userRepo.findOne({
        where: { id: merchantId },
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
          'contact_count',
          'created_at',
        ],
      });

      if (!merchant) {
        throw new HttpException('Merchant not found', 404);
      }

      const products = await this.productRepo.find({
        where: { user: { id: merchantId } },
        select: ['id', 'product_name'],
        relations: ['product_views'],
      });

      const totalProductViews = products.reduce(
        (total, product) => total + (product.product_views?.length || 0),
        0,
      );

      return {
        ...merchant,
        totalProductViews, // Add total product views to the response
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findMerchants(search?: string, schoolId?: string): Promise<any[]> {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async verifyOtp(payload: { email: string; otp: string }) {
    try {
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
          'contact_count',
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

      return { message: 'OTP verified successfully', id: user.id };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    try {
      const { email } = resendOtpDto;
      const user = await this.userRepo.findOne({
        where: { email },
        select: [
          'first_name',
          'last_name',
          'phone',
          'id',
          'contact_count',
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(id: string, updateUserDto: Partial<UpdateUserDto>) {
    const { email, school, ...restOfPayload } = updateUserDto;

    try {
      const user = await this.userRepo.findOne({
        where: { id },
        select: [
          'first_name',
          'last_name',
          'phone',
          'id',
          'profile_picture',
          'is_active',
          'contact_count',
          'is_merchant_verified',
          'email',
          'identification',
          'user_status',
        ],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = { ...user, ...restOfPayload };

      return await this.userRepo.save(updatedUser);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async updateSchool(id: string, updateUserSchoolDto: UpdateUserSchoolDto) {
    try {
      const existingUser = await this.userRepo.findOne({
        where: { id },
      });

      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          'Email is already in use by another user.',
        );
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
          'contact_count',
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    try {
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
          'contact_count',
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async photoIdentification(userId: string, file: Express.Multer.File) {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async verifyPasswordOtp(resetPasswordDto: VerifyPasswordOtpDto) {
    try {
      const { reset_token, email } = resetPasswordDto;

      // Find user by reset token
      const user = await this.userRepo.findOne({
        where: { reset_token, email },
      });

      if (!user) {
        throw new NotFoundException('Invalid reset token');
      }

      const tokenAge =
        (new Date().getTime() -
          new Date(user.reset_token_created_at).getTime()) /
        5000;

      // Check if token expired (1 minute)
      if (tokenAge > 60) {
        throw new ConflictException('Reset token expired');
      }

      user.reset_token = null;

      await this.userRepo.save(user);

      return { message: 'Otp verification successful' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async updatePassword(createNewPasswordDto: CreateNewPasswordDto) {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<any> {
    try {
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
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getCurrentUser(userId: string): Promise<User | undefined> {
    try {
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
          'contact_count',
          'identification',
          'user_status',
          'user_type',
        ],
      });
      if (!user) throw new NotFoundErrorException('User not found');

      return user;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async find() {
    try {
      const user = await this.userRepo.find({
        select: [
          'first_name',
          'last_name',
          'phone',
          'id',
          'profile_picture',
          'is_active',
          'contact_count',
          'is_merchant_verified',
          'email',
          'identification',
          'user_status',
        ],
        relations: ['school'],
      });

      if (!user) {
        throw new NotFoundException('Unable to find user');
      }

      return user;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private async uploadUserImage(file: Express.Multer.File | undefined) {
    try {
      if (!file) {
        return null;
      }
      const uploadedFile = await this.cloudinaryService.uploadFile(
        file,
        'profile_pictures',
      );

      return uploadedFile.secure_url;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteUserByEmail(email: string): Promise<{ message: string }> {
    try {
      const result = await this.userRepo.delete({ email });

      if (result.affected === 0) {
        throw new NotFoundException(`User with email ${email} not found.`);
      }

      return {
        message: `User with email ${email} has been deleted successfully.`,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async incrementContactCount(userId: string): Promise<void> {
    try {
      const userContact = await this.userRepo.increment(
        { id: userId },
        'contact_count',
        1,
      );

      if (!userContact)
        throw new BadRequestException('Unable to increment contact');
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteUserAccount(id: string): Promise<{ message: string }> {
    try {
      const result = await this.userRepo.delete({ id });

      if (result.affected === 0) {
        throw new NotFoundException(`User account not found`);
      }

      return {
        message: `User account successfully deleted`,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
  // get all bank account
  async getBankAccount(): Promise<any> {
    try {
      const banks = await this.flutterwaveService.getAllBanks();
      return banks;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  //update banks details
  async updateBankDetails(id: string, updateBankDto: UpdateBankDto) {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // confirm bank details
      const verifyBank = await this.flutterwaveService.verifyBankAccount(
        updateBankDto.bank_account_number,
        updateBankDto.bank_code,
      );

      Object.assign(user, {
        bank_account_number: verifyBank.data.account_number,
        bank_name: updateBankDto.bank_name,
        bank_account_name: verifyBank.data.account_name,
      });

      return await this.userRepo.save(user);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
