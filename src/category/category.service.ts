import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const { name } = createCategoryDto;
      const validate = await this.categoryRepo.findOne({
        where: {
          name,
        },
      });
      if (validate) throw new BadRequestException('Category already exists');
      const result = await this.categoryRepo.save(createCategoryDto);
      if (!result) throw new BadRequestException('Unable to create category');
      return result;
    } catch (error) {
      throw Error(error);
    }
  }

  async findAll(search?: string): Promise<Category[]> {
    try {
      const queryBuilder = this.categoryRepo.createQueryBuilder('category');
      if (search) {
        queryBuilder.where('LOWER(category.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }
      return await queryBuilder.getMany();
    } catch (error) {
      throw Error(error);
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category)
        throw new NotFoundException(`Category with id ${id} not found`);
      return category;
    } catch (error) {
      throw Error(error);
    }
  }

  async findOneByName(name: string) {
    try {
      const category = await this.categoryRepo.findOne({ where: { name } });
      if (!category)
        throw new NotFoundException(`Category with name: ${name} not found`);
      return category;
    } catch (error) {
      throw Error(error);
    }
  }

  async update(id: string, updateCategoryDto: Partial<UpdateCategoryDto>) {
    try {
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      Object.assign(category, updateCategoryDto);
      return await this.categoryRepo.save(category);
    } catch (error) {
      throw Error(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with id ${id} not found`);
      }
      await this.categoryRepo.delete(id);
    } catch (error) {
      throw Error(error);
    }
  }
}
