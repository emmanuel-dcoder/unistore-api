import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import {
  AdminProductDto,
  ProductStatus,
} from 'src/product/dto/create-product.dto';
import { CategoryService } from 'src/category/category.service';
import { RandomSevenDigits } from 'src/core/common';

@Injectable()
export class AdminProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
  ) {}

  async create(
    adminProductDto: AdminProductDto,
    files: Array<Express.Multer.File>,
  ) {
    try {
      const { schoolId, merchantId, category, product_name, ...rest } =
        adminProductDto;

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

      const product = this.productRepo.create({
        ...rest,
        product_name,
        category: { id: category } as any,
        product_image: imageUrls,
        user: { id: merchantId } as any,
        school: { id: schoolId } as any,
        product_id: productId,
      });

      const saveProduct = await this.productRepo.save(product);
      if (!saveProduct) {
        throw new BadRequestException('Unable to create product');
      }

      return saveProduct;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      return product;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(
    productId: string,
    adminProductDto: Partial<AdminProductDto>,
    files: Array<Express.Multer.File> | undefined,
  ) {
    try {
      const { category, schoolId, merchantId, ...rest } = adminProductDto;

      const product = await this.productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      if (category) {
        product.category = { id: category } as any;
      }
      if (schoolId) {
        product.school = { id: schoolId } as any;
      }
      if (merchantId) {
        product.user = { id: merchantId } as any;
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

  async updateStatus(
    productId: string,
    status: ProductStatus,
  ): Promise<Product> {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      product.status = status;

      const updatedProduct = await this.productRepo.save(product);

      if (!updatedProduct) {
        throw new BadRequestException('Unable to update product status');
      }

      return updatedProduct;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findProducts(filters: {
    status?: ProductStatus;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      const queryBuilder = this.productRepo.createQueryBuilder('product');

      queryBuilder.leftJoinAndSelect('product.category', 'category');

      if (filters.status) {
        queryBuilder.andWhere('product.status = :status', {
          status: filters.status,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('product.product_id LIKE :search', {
              search: `%${filters.search}%`,
            })
              .orWhere('product.product_name LIKE :search', {
                search: `%${filters.search}%`,
              })
              .orWhere('category.name LIKE :search', {
                search: `%${filters.search}%`,
              })
              .orWhere('product.price LIKE :search', {
                search: `%${filters.search}%`,
              });
          }),
        );
      }

      queryBuilder.orderBy('product.created_at', 'DESC');

      if (filters.limit) {
        queryBuilder.take(filters.limit);
      }

      if (filters.page && filters.limit) {
        queryBuilder.skip((filters.page - 1) * filters.limit);
      }

      const products = await queryBuilder.getMany();

      const total = await queryBuilder.getCount();

      return { products, total };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      const result = await this.productRepo.remove(product);

      if (!result) {
        throw new BadRequestException('Unable to delete product');
      }

      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async approveProduct(id: string): Promise<Product> {
    try {
      const product = await this.productRepo.findOne({ where: { id } });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      product.is_approved = true;
      return await this.productRepo.save(product);
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

      return uploadedFiles.map((uploadResult) => uploadResult.url);
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
