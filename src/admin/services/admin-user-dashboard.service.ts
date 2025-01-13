import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';

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
  ) {}

  private calculateCategoryChangePercentage(
    categories: Category[],
    currentCounts: Record<string, number>,
    previousCounts: Record<string, number>,
  ): any[] {
    const categoryChange: any[] = [];

    categories.forEach((category) => {
      const currentCount = currentCounts[category.id] || 0;
      const previousCount = previousCounts[category.id] || 0;
      const percentageChange = previousCount
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0; // 0% change if no products in previous month

      categoryChange.push({
        categoryName: category.name,
        currentCount,
        previousCount,
        percentageChange,
      });
    });

    return categoryChange;
  }

  async getUserAndOrderCounts(): Promise<any> {
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
    const currentOrders = await this.invoiceRepo.count({
      where: {
        created_at: Between(sevenDaysAgo, currentDate),
      },
    });

    // Get order counts in the previous 7 days
    const previousOrders = await this.invoiceRepo.count({
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
      currentOrders > 0
        ? this.calculatePercentageChange(currentOrders, previousOrders)
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
      orderCount: currentOrders,
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

  async getMerchantStats(
    schoolId: string,
    search: string = '',
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Query to filter merchants by school_id and user_type
    const query: any = {
      user: {
        school: { id: schoolId }, // Filtering merchants by their school_id
        user_type: 'merchant', // Ensure the user is a merchant
      },
    };

    // Optional search filter for first_name or last_name of the user (merchant)
    if (search) {
      query.user = {
        ...query.user,
        first_name: Like(`%${search}%`),
        last_name: Like(`%${search}%`),
      };
    }

    // Fetch product count related to all merchants within the given school
    const productCount = await this.productRepo.count({
      where: query,
    });

    // Fetch order count related to all merchants within the given school
    const orderCount = await this.invoiceRepo.count({
      where: {
        product_owner: {
          school: { id: schoolId },
          user_type: 'merchant',
        },
      },
    });

    // Optional: Pagination for fetching products
    const products = await this.productRepo.find({
      where: query,
      skip,
      take: limit,
    });

    // Optional: Pagination for fetching orders
    const orders = await this.invoiceRepo.find({
      where: {
        product_owner: {
          school: { id: schoolId },
          user_type: 'merchant',
        },
      },
      skip,
      take: limit,
    });

    return {
      productCount,
      orderCount,
      products,
      orders,
    };
  }

  async findCategory(): Promise<Category[]> {
    const category = this.categoryRepo.find();
    if (!category) throw new BadRequestException('Unable to fetch categories');
    return category;
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

  async getInactiveUsers(page: number, limit: number): Promise<User[]> {
    const skip = (page - 1) * limit;
    return await this.userRepo.find({
      where: { is_active: false },
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
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
}
