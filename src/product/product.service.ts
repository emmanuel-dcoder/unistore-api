import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryService } from 'src/category/category.service';
import { NotFoundErrorException, RandomSevenDigits } from 'src/core/common';
import { UserService } from 'src/user/user.service';
import { PaginationDto } from 'src/admin/dto/invoice-admin.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
    private readonly userService: UserService,
  ) {}

  async create(
    createProductDto: Partial<CreateProductDto>,
    files: Array<Express.Multer.File>,
    user: string,
    school: string,
  ) {
    try {
      const { product_name, category, ...rest } = createProductDto;
      await this.categoryService.findOne(category);
      const existingProduct = await this.productRepo.findOne({
        where: { product_name, user: { id: user } },
      });
      if (existingProduct) {
        throw new BadRequestException(
          'Product already exists with the given name',
        );
      }
      const imageUrls = await this.uploadProductImages(files);

      let productId;
      let validateOrder;

      do {
        productId = RandomSevenDigits();
        validateOrder = await this.productRepo.findOne({
          where: { product_id: productId },
        });
      } while (validateOrder);

      // Create the product with user and school
      const product = await this.productRepo.create({
        ...rest,
        product_name,
        category: { id: category } as any,
        product_image: imageUrls,
        user: { id: user } as any,
        school: { id: school } as any,
        product_id: productId,
      });

      const saveProduct = await this.productRepo.save(product);
      if (!saveProduct) {
        throw new BadRequestException('Unable to create product');
      }

      return saveProduct;
    } catch (error) {
      console.log('error for creating product:', error);
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(
    productId: string,
    updateProductDto: Partial<CreateProductDto> & {
      school?: string;
      user?: string;
    },
    files: Array<Express.Multer.File> | undefined,
  ) {
    try {
      const { category, school, user, ...rest } = updateProductDto;

      const product = await this.productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      if (category) {
        product.category = { id: category } as any;
      }
      if (school) {
        product.school = { id: school } as any;
      }
      if (user) {
        product.user = { id: user } as any;
      }

      if (files && files.length > 0) {
        const imageUrls = await this.uploadProductImages(files);

        product.product_image = [
          ...(product.product_image || []),
          ...imageUrls,
        ];
      }

      Object.assign(product, rest);

      const updatedProduct = await this.productRepo.save(product);

      if (!updatedProduct) {
        throw new BadRequestException('Unable to update product');
      }

      return updatedProduct;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async removeProductImage(productId: string, imageUrl: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      product.product_image = product.product_image.filter(
        (img) => img !== imageUrl,
      );

      const updatedProduct = await this.productRepo.save(product);

      return updatedProduct;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async updateWithoutImage(
    productId: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<Product> {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      Object.assign(product, updateData);
      return this.productRepo.save(product);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findByUser(
    userId: string,
    paginationDto: Partial<PaginationDto>,
    search: string,
    schoolId: string,
  ) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const confirmUser = await this.userService.getCurrentUser(userId);

      const queryBuilder = this.productRepo.createQueryBuilder('product');

      if (confirmUser.user_type === 'user') {
        queryBuilder.where('product.is_approved = :isApproved', {
          isApproved: true,
        });
      }

      queryBuilder
        .where('product.user = :userId', { userId })
        .andWhere('product.school = :schoolId', { schoolId })
        .leftJoinAndSelect('product.user', 'user')
        .addSelect([
          'user.id',
          'user.first_name',
          'user.last_name',
          'user.profile_picture',
        ])
        .leftJoinAndSelect('product.school', 'school')
        .leftJoinAndSelect('product.product_views', 'product_views')
        .addSelect([
          'product_views.first_name',
          'product_views.last_name',
          'product_views.email',
          'product_views.profile_picture',
          'product_views.is_merchant_verified',
          'product_views.is_active',
        ]);

      if (search) {
        queryBuilder.andWhere(
          '(product.product_name ILIKE :search OR product.product_description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const [products, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findById(productId: string, userId?: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId },
        relations: ['user', 'school', 'product_views'], // Load relations
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Select only necessary fields manually
      const filteredProduct = {
        ...product,
        user: product.user
          ? {
              id: product.user.id,
              first_name: product.user.first_name,
              last_name: product.user.last_name,
              email: product.user.email,
              phone: product.user.phone,
              profile_picture: product.user.profile_picture,
              is_merchant_verified: product.user.is_merchant_verified,
              is_active: product.user.is_active,
              identification: product.user.identification,
              level: product.user.level,
              matric_no: product.user.matric_no,
              department: product.user.department,
            }
          : null,
        school: product.school
          ? {
              id: product.school.id,
              name: product.school.name,
              image: product.school.image,
              abbreviation: product.school.abbreviation,
              school_id: product.school.school_id,
            }
          : null,
        product_views: product.product_views.map((viewedUser) => ({
          id: viewedUser.id,
          first_name: viewedUser.first_name,
          last_name: viewedUser.last_name,
          email: viewedUser.email,
          phone: viewedUser.phone,
          profile_picture: viewedUser.profile_picture,
          is_active: viewedUser.is_active,
          is_merchant_verified: viewedUser.is_merchant_verified,
        })),
      };

      // Handle product view tracking
      if (userId) {
        const user = await this.userService.findById(userId);

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const isUserViewed = product.product_views.some(
          (viewedUser) => viewedUser.id === userId,
        );

        if (!isUserViewed) {
          await this.productRepo
            .createQueryBuilder()
            .relation('product', 'product_views')
            .of(productId)
            .add(userId);
        }
      }

      return filteredProduct;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findAll(
    schoolId: string,
    paginationDto: PaginationDto,
    productName?: string,
  ) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const queryBuilder = this.productRepo.createQueryBuilder('product');

      queryBuilder
        .where('product.school_id = :schoolId', { schoolId })
        .andWhere('product.is_approved = :isApproved', { isApproved: true });

      if (productName) {
        queryBuilder.andWhere('product.product_name ILIKE :search', {
          search: `%${productName}%`,
        });
      }

      queryBuilder
        .leftJoinAndSelect('product.user', 'user')
        .addSelect([
          'user.id',
          'user.first_name',
          'user.last_name',
          'user.profile_picture',
        ])
        .leftJoinAndSelect('product.school', 'school')
        .leftJoinAndSelect('product.product_views', 'product_views')
        .addSelect([
          'product_views.first_name',
          'product_views.last_name',
          'product_views.email',
          'product_views.profile_picture',
          'product_views.is_merchant_verified',
          'product_views.is_active',
        ]);

      const [products, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        data: products,
      };
    } catch (error) {
      console.log('error');
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findByCategoryAndPrice(
    paginationDto: PaginationDto,
    categoryName: string,
    filters: {
      minPrice?: string;
      maxPrice?: string;
      minRating?: number;
      maxRating?: number;
    },
    schoolId?: string,
  ) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      if (categoryName && !schoolId) {
        throw new BadRequestException(
          'Category name and school ID are required.',
        );
      }

      const { minPrice, maxPrice, minRating, maxRating } = filters;

      const queryBuilder = this.productRepo
        .createQueryBuilder('product')
        .innerJoinAndSelect('product.category', 'category')
        .where('product.is_approved = :isApproved', { isApproved: true })
        .andWhere('category.name ILIKE :categoryName', {
          categoryName: `%${categoryName}%`,
        })
        .leftJoinAndSelect('product.product_views', 'product_views')
        .addSelect([
          'product_views.first_name',
          'product_views.last_name',
          'product_views.email',
          'product_views.profile_picture',
          'product_views.is_merchant_verified',
          'product_views.is_active',
        ]);

      if (schoolId) {
        queryBuilder.andWhere('product.school_id = :schoolId', { schoolId });
      }

      if (minPrice) {
        queryBuilder.andWhere('price_range ILIKE :minPrice', {
          minPrice: `%${minPrice}%`,
        });
      }
      if (maxPrice) {
        queryBuilder.andWhere('price_range ILIKE :maxPrice', {
          maxPrice: `%${maxPrice}%`,
        });
      }

      if (minRating) {
        queryBuilder.andWhere('product.avg_rating >= :minRating', {
          minRating,
        });
      }

      if (maxRating) {
        queryBuilder.andWhere('product.avg_rating <= :maxRating', {
          maxRating,
        });
      }

      const [products, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async delete(productId: string): Promise<void> {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      await this.productRepo.delete(productId);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteAll() {
    try {
      const deleteResult = await this.productRepo.delete({});
      if (deleteResult.affected === 0) {
        throw new NotFoundErrorException('No products found to delete.');
      }
      return {
        message: 'All products have been deleted successfully.',
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private async uploadProductImages(
    files: Array<Express.Multer.File> | undefined,
  ): Promise<string[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files were provided for upload.');
      }

      const uploadedFiles = await Promise.all(
        files.map((file) =>
          this.cloudinaryService.uploadFile(file, 'products'),
        ),
      );

      return uploadedFiles.map((uploadResult) => uploadResult.secure_url);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
