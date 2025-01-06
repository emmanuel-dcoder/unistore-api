import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { AdminProductDto } from 'src/product/dto/create-product.dto';
import { CategoryService } from 'src/category/category.service';

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

    // Create the product with user and school
    const product = this.productRepo.create({
      ...rest,
      product_name,
      category: { id: category } as any,
      product_image: imageUrls,
      user: { id: merchantId } as any,
      school: { id: schoolId } as any,
    });

    const saveProduct = await this.productRepo.save(product);
    if (!saveProduct) {
      throw new BadRequestException('Unable to create product');
    }

    return saveProduct;
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
