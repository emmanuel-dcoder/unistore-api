import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    let productId = RandomSevenDigits();
    const validateOrder = await this.productRepo.findOne({
      where: { product_id: productId },
    });

    do {
      productId = RandomSevenDigits();
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
  }

  async update(
    productId: string,
    adminProductDto: Partial<AdminProductDto>,
    files: Array<Express.Multer.File> | undefined,
  ) {
    const { category, schoolId, merchantId, ...rest } = adminProductDto;

    // Fetch the product to update
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Update category if provided
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
  }

  async updateStatus(
    productId: string,
    status: ProductStatus,
  ): Promise<Product> {
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
  }

  async findProducts(filters: {
    status?: ProductStatus;
    product_id?: string;
    product_name?: string;
    category?: string;
    price?: number;
  }) {
    const queryBuilder = this.productRepo.createQueryBuilder('product');

    if (filters.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: filters.status,
      });
    }

    if (filters.product_id) {
      queryBuilder.andWhere('product.product_id LIKE :product_id', {
        product_id: `%${filters.product_id}%`,
      });
    }

    if (filters.product_name) {
      queryBuilder.andWhere('product.product_name LIKE :product_name', {
        product_name: `%${filters.product_name}%`,
      });
    }

    if (filters.category) {
      queryBuilder.andWhere('product.category.name LIKE :category', {
        category: `%${filters.category}%`,
      });
    }

    if (filters.price) {
      queryBuilder.andWhere('product.price <= :price', {
        price: filters.price,
      });
    }

    queryBuilder.orderBy('product.created_at', 'DESC'); // Order by creation date in descending order

    const products = await queryBuilder.getMany();
    return products;
  }

  private async uploadProductImages(
    files: Array<Express.Multer.File> | undefined,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were provided for upload.');
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadFile(file, 'products')),
    );

    return uploadedFiles.map((uploadResult) => uploadResult.url);
  }
}
