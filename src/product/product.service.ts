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

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
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
        where: { product_name },
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

        product.product_image = [...product.product_image, ...imageUrls];
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

  async findByUser(userId: string, search: string, schoolId: string) {
    try {
      const queryBuilder = this.productRepo.createQueryBuilder('product');

      queryBuilder
        .where('product.user = :userId', { userId })
        .andWhere('product.school = :schoolId', { schoolId })
        .andWhere('product.is_approved = :isApproved', { isApproved: true })
        .leftJoinAndSelect('product.user', 'user')
        .addSelect([
          'user.id',
          'user.first_name',
          'user.last_name',
          'user.profile_picture',
        ])
        .leftJoinAndSelect('product.school', 'school');

      if (search) {
        queryBuilder.andWhere(
          '(product.product_name ILIKE :search OR product.product_description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const products = await queryBuilder.getMany();

      return products;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findById(productId: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId, is_approved: true },
        relations: ['user', 'school'],
        select: {
          user: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            profile_picture: true,
          },
          school: {
            id: true,
            name: true,
            image: true,
            abbreviation: true,
            school_id: true,
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findAll(schoolId: string, productName?: string): Promise<Product[]> {
    try {
      const queryBuilder = this.productRepo.createQueryBuilder('product');

      // Add search filter if productName is provided
      if (productName) {
        queryBuilder.where('product.product_name ILIKE :search', {
          search: `%${productName}%`,
        });
      }

      queryBuilder
        .where('product.school = :schoolId', { schoolId })
        .andWhere('product.is_approved = :isApproved', { isApproved: true })
        .leftJoinAndSelect('product.user', 'user')
        .addSelect([
          'user.id',
          'user.first_name',
          'user.last_name',
          'user.profile_picture',
        ])
        .leftJoinAndSelect('product.school', 'school');

      const products = await queryBuilder.getMany();
      return products;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findByCategoryAndPrice(
    categoryName: string,
    filters: {
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      maxRating?: number;
    },
    schoolId?: string,
  ) {
    try {
      const { minPrice, maxPrice, minRating, maxRating } = filters;

      const query: any = {
        categoryName,
        school: schoolId ? schoolId : null,
        is_approved: true,
      };

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          query.price.$lte = maxPrice;
        }
      }

      if (minRating !== undefined || maxRating !== undefined) {
        query.avgRating = {};
        if (minRating !== undefined) {
          query.avgRating.$gte = minRating;
        }
        if (maxRating !== undefined) {
          query.avgRating.$lte = maxRating;
        }
      }

      // Fetch products based on the query
      const products = await this.productRepo.find(query);

      if (!products || products.length === 0) {
        throw new NotFoundException('No products found matching the criteria');
      }

      return products;
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
