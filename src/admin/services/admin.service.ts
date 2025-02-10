import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChangePasswordDto, CreateAdminDto } from '../dto/create-admin.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from '../entities/admin.entity';
import { Repository } from 'typeorm';
import { generateAccessToken, hashPassword } from 'src/core/common';
import { LoginDto } from 'src/user/dto/login.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
  ) {}

  async create(payload: CreateAdminDto) {
    try {
      const hashedPassword = await hashPassword(payload.password);
      payload.password = hashedPassword;

      const result = await this.adminRepo.save(payload);

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

      const admin = await this.adminRepo.findOne({
        where: { email },

        select: [
          'first_name',
          'last_name',
          'user_type',
          'id',
          'profile_picture',
          'email',
          'password',
          'is_active',
        ],
      });

      if (!admin) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const access_token = generateAccessToken(
        {
          id: admin.id,
          first_name: admin.first_name,
          last_name: admin.last_name,
          user_type: admin.user_type,
          is_active: admin.is_active,
        },
        'user_access_key',
      );

      return {
        access_token,
        admin: {
          id: admin.id,
          email: admin.email,
          first_name: admin.first_name,
          last_name: admin.last_name,
          user_type: admin.user_type,
        },
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async uploadProfilePicture(adminId: string, file: Express.Multer.File) {
    try {
      const admin = await this.adminRepo.findOne({
        where: { id: adminId },
      });

      if (!admin) {
        throw new NotFoundException('User not found');
      }

      const uploadedFile = await this.uploadImage(file);
      admin.profile_picture = uploadedFile.secure_url;

      await this.adminRepo.save(admin);

      return {
        message: 'Profile picture uploaded successfully',
        profile_picture: uploadedFile.secure_url,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getCurrentAdmin(adminId: string): Promise<Admin | undefined> {
    try {
      const admin = await this.adminRepo.findOne({
        where: { id: adminId },
        select: [
          'first_name',
          'last_name',
          'phone',
          'id',
          'profile_picture',
          'is_active',
          'email',
          'sex',
          'country',
          'date_of_birth',
          'is_active',
          'phone',
          'state',
          'username',
          'user_type',
        ],
      });
      if (!admin) throw new NotFoundException('Admin not found');

      return admin;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const { currentPassword, newPassword } = changePasswordDto;

      const admin = await this.adminRepo.findOne({ where: { id: adminId } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      const isPasswordValid = await compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      admin.password = await hashPassword(newPassword);
      await this.adminRepo.save(admin);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAdmins(filters: { email?: string; username?: string }) {
    try {
      const { email, username } = filters;

      const query = this.adminRepo.createQueryBuilder('admin');

      if (email) {
        query.andWhere('admin.email = :email', { email });
      }

      if (username) {
        query.andWhere('admin.username = :username', { username });
      }

      const admins = await query.getMany();
      if (!admins.length) {
        throw new NotFoundException(
          'No admin(s) found with the provided criteria',
        );
      }

      return admins;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private async uploadImage(file: Express.Multer.File | undefined) {
    try {
      if (!file) {
        return null;
      }
      const uploadedFile = await this.cloudinaryService.uploadFile(
        file,
        'profile_pictures',
      );
      return uploadedFile.url;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async updateAdmin(id: string, updateAdminDto: any): Promise<Admin> {
    try {
      const admin = await this.adminRepo.findOne({ where: { id } });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      try {
        Object.assign(admin, updateAdminDto);
        return await this.adminRepo.save(admin);
      } catch (error) {
        throw new BadRequestException('Failed to update admin');
      }
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteAdmin(id: string): Promise<void> {
    try {
      const admin = await this.adminRepo.findOne({ where: { id } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      await this.adminRepo.delete(id);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
