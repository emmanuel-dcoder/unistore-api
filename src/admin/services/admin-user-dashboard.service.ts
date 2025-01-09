import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';
import { Order } from 'src/invoice/entities/order.entity';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AdminUserDashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getPaidProductsForMonth(): Promise<any[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Find all paid orders within the current month
    const orders = await this.orderRepo.find({
      where: {
        status: 'paid',
        created_at: Between(
          new Date(currentYear, currentMonth, 1),
          new Date(currentYear, currentMonth + 1, 0),
        ),
      },
      relations: ['invoices', 'invoices.product'],
    });

    const productSales: Record<string, { totalAmount: number; name: string }> =
      {};

    orders.forEach((order) => {
      order.invoices.forEach((invoice) => {
        const product = invoice.product;

        if (!productSales[product.product_name]) {
          productSales[product.product_name] = {
            totalAmount: 0,
            name: product.product_name,
          };
        }

        productSales[product.product_name].totalAmount +=
          product.price * invoice.quantity;
      });
    });

    return Object.values(productSales).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    );
  }

  async getCategoryProductCounts(): Promise<any[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    const categories = await this.categoryRepo.find();

    const currentMonthOrders = await this.orderRepo.find({
      where: {
        status: 'paid',
        created_at: Between(
          new Date(currentYear, currentMonth, 1),
          new Date(currentYear, currentMonth + 1, 0),
        ),
      },
      relations: ['invoices', 'invoices.product', 'invoices.product.category'],
    });

    const previousMonthOrders = await this.orderRepo.find({
      where: {
        status: 'paid',
        created_at: Between(
          new Date(previousMonthYear, previousMonth, 1),
          new Date(previousMonthYear, previousMonth + 1, 0),
        ),
      },
      relations: ['invoices', 'invoices.product', 'invoices.product.category'],
    });

    // Aggregate product counts by category for the current month
    const currentMonthCategoryCounts =
      this.aggregateProductCountsByCategory(currentMonthOrders);

    // Aggregate product counts by category for the previous month
    const previousMonthCategoryCounts =
      this.aggregateProductCountsByCategory(previousMonthOrders);

    // Calculate percentage change and include categories with zero count
    return this.calculateCategoryChangePercentage(
      categories,
      currentMonthCategoryCounts,
      previousMonthCategoryCounts,
    );
  }

  private aggregateProductCountsByCategory(
    orders: Order[],
  ): Record<string, number> {
    const categoryCounts: Record<string, number> = {};

    orders.forEach((order) => {
      order.invoices.forEach((invoice) => {
        const product = invoice.product;
        const categoryId = product.category.id;

        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      });
    });

    return categoryCounts;
  }

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
    const currentOrders = await this.orderRepo.count({
      where: {
        created_at: Between(sevenDaysAgo, currentDate),
      },
    });

    // Get order counts in the previous 7 days
    const previousOrders = await this.orderRepo.count({
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

  async getOrdersWithPagination(
    page: number = 1,
    limit: number = 10,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    // Convert startDate and endDate to Date objects if they are provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await this.orderRepo.find({
      where: {
        created_at: Between(start, end),
      },
      relations: ['invoices', 'user', 'product_owner'],
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
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

    const totalOrders = await this.orderRepo.count({
      where: {
        created_at: Between(start, end),
      },
    });

    return {
      orders,
      totalOrders,
      page,
      totalPages: Math.ceil(totalOrders / limit),
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
      // Filter by school_id and merchant user_type
      product_owner: {
        school: { id: schoolId }, // Filtering merchants by their school_id
        user_type: 'merchant', // Ensure the user is a merchant
      },
    };

    // Optional search filter for first_name or last_name of the user (merchant)
    if (search) {
      query.product_owner = {
        ...query.product_owner,
        first_name: Like(`%${search}%`),
        last_name: Like(`%${search}%`),
      };
    }

    // Fetch product count related to all merchants within the given school
    const productCount = await this.productRepo.count({
      where: query,
    });

    // Fetch order count related to all merchants within the given school
    const orderCount = await this.orderRepo.count({
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
    const orders = await this.orderRepo.find({
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

  async getUsersWithOrderCounts(
    page: number = 1,
    limit: number = 10,
    schoolId: string,
    search?: string,
  ) {
    // Default pagination values
    const skip = (page - 1) * limit;

    // Build the query to fetch users with filters
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.user_type = :userType', { userType: 'user' })
      .andWhere('user.school_id = :schoolId', { schoolId });

    // Optional search filter
    if (search) {
      query.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Execute the query with pagination
    const [users, total] = await query.skip(skip).take(limit).getManyAndCount(); // Ensures `users` is an array and total count is fetched

    // Fetch order counts for each user
    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        const paidCount = await this.orderRepo.count({
          where: { user: { id: user.id }, status: 'paid' },
        });
        const pendingCount = await this.orderRepo.count({
          where: { user: { id: user.id }, status: 'awaiting_payment' },
        });

        return {
          ...user,
          orderCounts: {
            paid: paidCount,
            pending: pendingCount,
          },
        };
      }),
    );

    // Return the response with pagination metadata
    return {
      data: usersWithOrderCounts,
      total,
      page,
      limit,
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
