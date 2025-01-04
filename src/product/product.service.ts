import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryService } from 'src/category/category.service';
import { NotFoundErrorException } from 'src/core/common';

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

    // Create the product with user and school
    const product = this.productRepo.create({
      ...rest,
      product_name,
      category: { id: category } as any,
      product_image: imageUrls,
      user: { id: user } as any,
      school: { id: school } as any,
    });

    const saveProduct = await this.productRepo.save(product);
    if (!saveProduct) {
      throw new BadRequestException('Unable to create product');
    }

    return saveProduct;
  }

  async update(
    productId: string,
    updateProductDto: Partial<CreateProductDto> & {
      school?: string;
      user?: string;
    }, // Assuming this DTO has all the fields needed for update
    files: Array<Express.Multer.File> | undefined,
  ) {
    const { category, school, user, ...rest } = updateProductDto;

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
    if (school) {
      product.school = { id: school } as any;
    }
    if (user) {
      product.user = { id: user } as any;
    }

    // If new files (images) are provided, upload them and add to the existing product_image array
    if (files && files.length > 0) {
      const imageUrls = await this.uploadProductImages(files);
      // Add new images to existing product_image array
      product.product_image = [...product.product_image, ...imageUrls];
    }

    // Merge rest of the data (e.g. product_name, product_description, etc.)
    Object.assign(product, rest);

    // Save the updated product
    const updatedProduct = await this.productRepo.save(product);

    if (!updatedProduct) {
      throw new BadRequestException('Unable to update product');
    }

    return updatedProduct;
  }

  async updateWithoutImage(
    productId: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    Object.assign(product, updateData); // Merge the update data into the existing product
    return this.productRepo.save(product); // Save the updated product
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

  async findByUser(userId: string, search?: string): Promise<Product[]> {
    const queryBuilder = this.productRepo.createQueryBuilder('product');

    queryBuilder
      .where('product.userId = :userId', { userId })
      .leftJoinAndSelect('product.user', 'user')
      .addSelect([
        'user.id',
        'sender.first_name',
        'sender.last_name',
        'sender.profile_picture',
      ])
      .leftJoinAndSelect('product.school', 'school');

    if (search) {
      queryBuilder.andWhere(
        '(product.product_name ILIKE :search OR product.product_description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const products = await queryBuilder.getMany();

    if (!products.length) {
      throw new BadRequestException('No products found for this user');
    }

    return products;
  }

  async findById(productId: string) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['user', 'school'], // Include related entities if needed
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findAll(productName?: string): Promise<Product[]> {
    const queryBuilder = this.productRepo.createQueryBuilder('product');

    // Add search filter if productName is provided
    if (productName) {
      queryBuilder.where('product.product_name ILIKE :search', {
        search: `%${productName}%`,
      });
    }

    queryBuilder
      .leftJoinAndSelect('product.user', 'user') // Join the user relationship
      .addSelect([
        'user.id', // Include the specific fields from the user
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
      ])
      .leftJoinAndSelect('product.school', 'school'); // Join the school relationship

    const products = await queryBuilder.getMany();
    return products;
  }

  async findByCategoryAndPrice(
    categoryName: string,
    price: number,
  ): Promise<Product[]> {
    const category = await this.categoryService.findOneByName(categoryName);

    if (!category) {
      throw new NotFoundErrorException('Category not found');
    }

    return this.productRepo.find({
      where: {
        category: { id: category.id },
        price,
      },
    });
  }

  async delete(productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    await this.productRepo.delete(productId);
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
      throw new BadRequestException(
        'Unable to delete products.',
        error.message,
      );
    }
  }
}
