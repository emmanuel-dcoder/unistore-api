import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { School } from 'src/school/entities/school.entity';
import { PaginationDto } from '../dto/invoice-admin.dto';
import { MerchantPaginationDto } from '../dto/update-admin.dto';
import { randomBytes } from 'crypto';
import { hashPassword } from 'src/core/common';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/core/mail/email';

@Injectable()
export class AdminUserDashboardService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  async createUser(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: string;
    description?: string;
  }): Promise<User> {
    try {
      const generatedPassword = randomBytes(3).toString('hex');

      const hashedPassword = await hashPassword(generatedPassword);

      const newUser = this.userRepo.create({
        ...payload,
        password: hashedPassword,
        is_active: true,
      });

      const savedUser = await this.userRepo.save(newUser);

      delete savedUser.password;

      return { ...savedUser };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getUserAndOInvoiceCounts(): Promise<any> {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();

      const sevenDaysAgo = new Date(currentYear, currentMonth, currentDay - 7);

      const fourteenDaysAgo = new Date(
        currentYear,
        currentMonth,
        currentDay - 14,
      );

      const currentInvoice = await this.invoiceRepo.count({
        where: {
          created_at: Between(sevenDaysAgo, currentDate),
        },
      });

      const previousInvoice = await this.invoiceRepo.count({
        where: {
          created_at: Between(fourteenDaysAgo, sevenDaysAgo),
        },
      });

      const currentMerchantUsers = await this.userRepo.count({
        where: {
          user_type: 'merchant',
          created_at: Between(sevenDaysAgo, currentDate),
        },
      });

      const previousMerchantUsers = await this.userRepo.count({
        where: {
          user_type: 'merchant',
          created_at: Between(fourteenDaysAgo, sevenDaysAgo),
        },
      });

      const currentUserUsers = await this.userRepo.count({
        where: {
          user_type: 'user',
          created_at: Between(sevenDaysAgo, currentDate),
        },
      });

      const previousUserUsers = await this.userRepo.count({
        where: {
          user_type: 'user',
          created_at: Between(fourteenDaysAgo, sevenDaysAgo),
        },
      });

      const orderPercentageChange =
        currentInvoice > 0
          ? this.calculatePercentageChange(currentInvoice, previousInvoice)
          : 0;
      const merchantPercentageChange =
        currentMerchantUsers > 0
          ? this.calculatePercentageChange(
              currentMerchantUsers,
              previousMerchantUsers,
            )
          : 0;
      const userPercentageChange =
        currentUserUsers > 0
          ? this.calculatePercentageChange(currentUserUsers, previousUserUsers)
          : 0;

      return {
        orderCount: currentInvoice,
        orderPercentageChange,
        merchantCount: currentMerchantUsers,
        merchantPercentageChange,
        userCount: currentUserUsers,
        userPercentageChange,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private calculatePercentageChange(
    currentCount: number,
    previousCount: number,
  ): number {
    try {
      if (previousCount === 0) {
        return currentCount === 0 ? 0 : 100;
      }
      return ((currentCount - previousCount) / previousCount) * 100;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getHighestPriceProduct(): Promise<Product[]> {
    try {
      return await this.productRepo.find({
        order: { price: 'DESC' },
        take: 5,
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getUsersByUserType(
    userType: string,
    page: number,
    limit: number,
  ): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      return await this.userRepo.find({
        where: { user_type: userType },
        skip: skip,
        take: limit,
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getInvoiceWithPagination(
    page: number = 1,
    limit: number = 10,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date();

      const invoice = await this.invoiceRepo.find({
        where: {
          created_at: Between(start, end),
        },
        relations: ['product_owner'],
        order: { created_at: 'DESC' },
        select: {
          product_owner: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          },
        },
        skip,
        take: limit,
      });

      const totalInvoice = await this.invoiceRepo.count({
        where: {
          created_at: Between(start, end),
        },
      });

      return {
        invoice,
        totalInvoice,
        page,
        totalPages: Math.ceil(totalInvoice / limit),
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAllSchoolsWithUserCounts(paginationDto: PaginationDto) {
    try {
      const { page, limit, searchQuery } = paginationDto;

      const searchFilter = searchQuery
        ? {
            where: [
              { name: Like(`%${searchQuery}%`) },
              { school_id: Like(`%${searchQuery}%`) },
            ],
          }
        : {};

      const [schools, totalSchools] = await this.schoolRepo.findAndCount({
        ...searchFilter,
        skip: (page - 1) * limit,
        take: limit,
      });

      const schoolsWithCounts = [];

      for (const school of schools) {
        const merchantCount = await this.userRepo.count({
          where: {
            school: { id: school.id },
            user_type: 'merchant',
          },
        });

        const userCount = await this.userRepo.count({
          where: {
            school: { id: school.id },
            user_type: 'user',
          },
        });

        schoolsWithCounts.push({
          school,
          userCounts: {
            merchant: merchantCount,
            user: userCount,
          },
        });
      }

      return {
        schools: schoolsWithCounts,
        totalSchools,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getUnverifiedMerchants(page: number, limit: number): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      return await this.userRepo.find({
        where: { is_merchant_verified: false },
        skip: skip,
        take: limit,
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getUserCountsBySchool(schoolId: string) {
    try {
      const merchantCount = await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.school', 'school')
        .where('school.id = :schoolId', { schoolId })
        .andWhere('user.user_type = :userType', { userType: 'merchant' })
        .getCount();

      // Count users with 'user' user_type
      const userCount = await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.school', 'school')
        .where('school.id = :schoolId', { schoolId })
        .andWhere('user.user_type = :userType', { userType: 'user' })
        .getCount();

      return {
        merchantCount,
        userCount,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findUsersBySchoolAndType(
    schoolId: string,
    userType: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      page = isNaN(page) ? 1 : Math.max(1, page);
      limit = isNaN(limit) ? 10 : Math.max(1, limit);

      const queryBuilder = this.userRepo.createQueryBuilder('user');

      queryBuilder
        .leftJoinAndSelect('user.school', 'school')
        .where('school.id = :schoolId', { schoolId })
        .andWhere('user.user_type IN (:...userTypes)', {
          userTypes: ['merchant', 'user'].includes(userType)
            ? [userType]
            : ['merchant', 'user'],
        })
        .orderBy('user.created_at', 'DESC');

      if (startDate) {
        queryBuilder.andWhere('user.created_at >= :startDate', { startDate });
      }
      if (endDate) {
        queryBuilder.andWhere('user.created_at <= :endDate', { endDate });
      }

      queryBuilder.skip((page - 1) * limit).take(limit);

      try {
        const [users, total] = await queryBuilder.getManyAndCount();
        return {
          data: users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      } catch (error) {
        throw new BadRequestException('Unable to fetch users');
      }
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAllSchoolMerchantsWithCounts(
    merchantPaginationDto: MerchantPaginationDto,
    school_id: string,
  ) {
    try {
      const { page = 1, limit = 10, searchQuery } = merchantPaginationDto;

      // Define the search filter
      const searchFilter = searchQuery
        ? {
            where: [
              { first_name: Like(`%${searchQuery}%`) },
              { last_name: Like(`%${searchQuery}%`) },
              { email: Like(`%${searchQuery}%`) },
            ],
          }
        : {};

      // Add school filter
      const schoolFilter = school_id ? { school: { id: school_id } } : {};

      // Fetch merchants based on the search filter, 'is_active', and school filter
      const [merchants, totalMerchants] = await this.userRepo.findAndCount({
        ...searchFilter,
        where: {
          user_type: 'merchant',
          ...schoolFilter,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: [
          'id',
          'first_name',
          'last_name',
          'email',
          'profile_picture',
          'user_type',
          'is_active',
          'is_merchant_verified',
          'created_at',
          'updated_at',
        ], // Exclude 'password'
      });

      const merchantsWithCounts = [];

      // Iterate through each merchant and count related products and invoices
      for (const merchant of merchants) {
        const productCount = await this.productRepo.count({
          where: { user: { id: merchant.id } },
        });

        const invoiceCount = await this.invoiceRepo.count({
          where: { product_owner: { id: merchant.id } },
        });

        merchantsWithCounts.push({
          merchant,
          counts: {
            products: productCount,
            invoices: invoiceCount,
          },
        });
      }

      return {
        merchants: merchantsWithCounts,
        totalMerchants,
        currentPage: page,
        totalPages: Math.ceil(totalMerchants / limit),
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAllSchoolUser(
    merchantPaginationDto: MerchantPaginationDto,
    school_id: string,
  ) {
    try {
      const { page = 1, limit = 10, searchQuery } = merchantPaginationDto;

      const searchFilter = searchQuery
        ? {
            where: [
              { first_name: Like(`%${searchQuery}%`) },
              { last_name: Like(`%${searchQuery}%`) },
              { email: Like(`%${searchQuery}%`) },
            ],
          }
        : {};

      const schoolFilter = school_id ? { school: { id: school_id } } : {};

      const [users, totalUsers] = await this.userRepo.findAndCount({
        ...searchFilter,
        where: {
          user_type: 'merchant',
          ...schoolFilter,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: [
          'id',
          'first_name',
          'last_name',
          'email',
          'profile_picture',
          'user_type',
          'is_active',
          'is_merchant_verified',
          'created_at',
          'updated_at',
        ],
      });

      return {
        users,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAllMerchantsWithCounts(
    merchantPaginationDto: MerchantPaginationDto,
  ) {
    try {
      const { page = 1, limit = 10, searchQuery } = merchantPaginationDto;

      // Define the search filter
      const searchFilter = searchQuery
        ? {
            where: [
              { first_name: Like(`%${searchQuery}%`) },
              { last_name: Like(`%${searchQuery}%`) },
              { email: Like(`%${searchQuery}%`) },
            ],
          }
        : {};

      // Fetch merchants based on the search filter, 'is_active', and school filter
      const [merchants, totalMerchants] = await this.userRepo.findAndCount({
        ...searchFilter,
        where: {
          user_type: 'merchant',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: [
          'id',
          'first_name',
          'last_name',
          'email',
          'profile_picture',
          'user_type',
          'is_active',
          'is_merchant_verified',
          'created_at',
          'updated_at',
        ], // Exclude 'password'
      });

      const merchantsWithCounts = [];

      // Iterate through each merchant and count related products and invoices
      for (const merchant of merchants) {
        const productCount = await this.productRepo.count({
          where: { user: { id: merchant.id } },
        });

        const invoiceCount = await this.invoiceRepo.count({
          where: { product_owner: { id: merchant.id } },
        });

        merchantsWithCounts.push({
          merchant,
          counts: {
            products: productCount,
            invoices: invoiceCount,
          },
        });
      }

      return {
        merchants: merchantsWithCounts,
        totalMerchants,
        currentPage: page,
        totalPages: Math.ceil(totalMerchants / limit),
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getMerchantProductAndInvoices(
    userId: string,
    search: string = '',
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.max(1, limit);
      const skip = (validatedPage - 1) * validatedLimit;

      // Get product count for the merchant
      const productCount = await this.productRepo.count({
        where: { user: { id: userId } },
      });

      // Count invoices by status
      const awaitingPaymentInvoiceCount = await this.invoiceRepo.count({
        where: {
          product_owner: { id: userId },
          status: 'awaiting_payment',
        },
      });

      const paidInvoiceCount = await this.invoiceRepo.count({
        where: {
          product_owner: { id: userId },
          status: 'paid',
        },
      });

      // Build the query for filtering invoices
      const query: any = {
        product_owner: { id: userId },
      };

      if (search) {
        query.invoice_id = Like(`%${search}%`);
      }

      if (startDate && endDate) {
        query.created_at = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        query.created_at = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        query.created_at = LessThanOrEqual(new Date(endDate));
      }

      // Get invoices with filtering and pagination
      const invoices = await this.invoiceRepo.find({
        where: query,
        skip,
        take: validatedLimit,
        order: { created_at: 'DESC' },
      });

      return {
        productCount,
        pendingInvoice: awaitingPaymentInvoiceCount,
        paidInvoice: paidInvoiceCount,
        invoices,
        pagination: {
          currentPage: validatedPage,
          pageSize: validatedLimit,
          totalInvoices: invoices.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findCategory(): Promise<Category[]> {
    try {
      const category = this.categoryRepo.find();
      if (!category)
        throw new BadRequestException('Unable to fetch categories');
      return category;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getInactiveUsers(page: number, limit: number): Promise<User[]> {
    try {
      const skip = (page - 1) * limit;
      return await this.userRepo.find({
        where: { is_active: false },
        skip: skip,
        take: limit,
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async verifyMerchant(id: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      user.is_merchant_verified = true;

      try {
        await this.mailService.sendMailNotification(
          user.email,
          'Congratulation... Account Verified',
          { name: user.first_name },
          'verified',
        );

        await this.notificationService.create(
          {
            title: 'Congratulation... Account Verified',
            message:
              'Congratulations, you merchant account is now verified on Unistore',
          },
          user.id,
        );
      } catch (error) {
        console.log('error:', error);
      }
      return await this.userRepo.save(user);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteUserAccount(email: string): Promise<{ message: string }> {
    try {
      if (typeof email !== 'string') {
        throw new BadRequestException('Invalid email format');
      }

      // Check if the user exists first
      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      const result = await this.userRepo.delete({ email });
      if (result.affected === 0) {
        throw new NotFoundException(`User account not found`);
      }

      return { message: `User account successfully deleted` };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
