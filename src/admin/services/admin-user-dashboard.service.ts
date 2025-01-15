import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { School } from 'src/school/entities/school.entity';
import { PaginationDto } from '../dto/invoice-admin.dto';
import { MerchantPaginationDto } from '../dto/update-admin.dto';

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
  ) {}

  async getUserAndOInvoiceCounts(): Promise<any> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Date for 7 days ago
    const sevenDaysAgo = new Date(currentYear, currentMonth, currentDay - 7);

    // Date for 14 days ago (for previous 7 days comparison)
    const fourteenDaysAgo = new Date(
      currentYear,
      currentMonth,
      currentDay - 14,
    );

    // Get order counts in the last 7 days
    const currentInvoice = await this.invoiceRepo.count({
      where: {
        created_at: Between(sevenDaysAgo, currentDate),
      },
    });

    // Get order counts in the previous 7 days
    const previousInvoice = await this.invoiceRepo.count({
      where: {
        created_at: Between(fourteenDaysAgo, sevenDaysAgo),
      },
    });

    // Get user counts with user_type "merchant" in the last 7 days
    const currentMerchantUsers = await this.userRepo.count({
      where: {
        user_type: 'merchant',
        created_at: Between(sevenDaysAgo, currentDate),
      },
    });

    // Get user counts with user_type "merchant" in the previous 7 days
    const previousMerchantUsers = await this.userRepo.count({
      where: {
        user_type: 'merchant',
        created_at: Between(fourteenDaysAgo, sevenDaysAgo),
      },
    });

    // Get user counts with user_type "user" in the last 7 days
    const currentUserUsers = await this.userRepo.count({
      where: {
        user_type: 'user',
        created_at: Between(sevenDaysAgo, currentDate),
      },
    });

    // Get user counts with user_type "user" in the previous 7 days
    const previousUserUsers = await this.userRepo.count({
      where: {
        user_type: 'user',
        created_at: Between(fourteenDaysAgo, sevenDaysAgo),
      },
    });

    // Set default counts and percentages to 0 if counts are 0 for the last 7 days
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
  }

  private calculatePercentageChange(
    currentCount: number,
    previousCount: number,
  ): number {
    if (previousCount === 0) {
      return currentCount === 0 ? 0 : 100; // If previous count is 0, and current is not, it's 100% increase
    }
    return ((currentCount - previousCount) / previousCount) * 100;
  }

  async getHighestPriceProduct(): Promise<Product[]> {
    return await this.productRepo.find({
      order: { price: 'DESC' },
      take: 5,
    });
  }

  async getUsersByUserType(
    userType: string,
    page: number,
    limit: number,
  ): Promise<User[]> {
    const skip = (page - 1) * limit;
    return await this.userRepo.find({
      where: { user_type: userType },
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async getInvoiceWithPagination(
    page: number = 1,
    limit: number = 10,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    // Convert startDate and endDate to Date objects if they are provided
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
  }

  //fetch universities
  async getAllSchoolsWithUserCounts(paginationDto: PaginationDto) {
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
  }

  async getUnverifiedMerchants(page: number, limit: number): Promise<User[]> {
    const skip = (page - 1) * limit;
    return await this.userRepo.find({
      where: { is_merchant_verified: false },
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async getUserCountsBySchool(schoolId: string) {
    // Count users with 'merchant' user_type
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
  }

  async getInactiveUsers(page: number, limit: number): Promise<User[]> {
    const skip = (page - 1) * limit;
    return await this.userRepo.find({
      where: { is_active: false },
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async getAllMerchantsWithCounts(
    merchantPaginationDto: MerchantPaginationDto,
  ) {
    const {
      page = 1,
      limit = 10,
      searchQuery,
      is_active,
    } = merchantPaginationDto;

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

    // Create the 'is_active' filter if specified
    const activeFilter = is_active !== undefined ? { is_active } : {};

    // Fetch merchants based on the search filter and 'is_active' filter
    const [merchants, totalMerchants] = await this.userRepo.findAndCount({
      ...searchFilter,
      where: { user_type: 'merchant', ...activeFilter },
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
  }

  async findUsersBySchoolAndType(
    schoolId: string,
    userType: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Ensure page and limit are valid numbers
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

    // Apply date filters if provided
    if (startDate) {
      queryBuilder.andWhere('user.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('user.created_at <= :endDate', { endDate });
    }

    // Pagination logic
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
  }

  async findCategory(): Promise<Category[]> {
    const category = this.categoryRepo.find();
    if (!category) throw new BadRequestException('Unable to fetch categories');
    return category;
  }
}
