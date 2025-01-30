import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { School } from './entities/school.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { RandomSevenDigits } from 'src/core/common';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(payload: CreateSchoolDto, file: Express.Multer.File) {
    try {
      const { name } = payload;
      const validateSchool = await this.schoolRepo.findOne({
        where: { name },
      });
      if (validateSchool)
        throw new BadRequestException(
          'This university/school name already exists',
        );

      let imageUrl = '';
      if (file) {
        imageUrl = await this.storeSchoolImage(file);
      }

      let schoolId = RandomSevenDigits();
      const confirmSchool = await this.schoolRepo.findOne({
        where: { school_id: schoolId },
      });

      do {
        schoolId = RandomSevenDigits();
      } while (confirmSchool);

      const newSchool = { ...payload, school_id: schoolId, image: imageUrl };

      const result = await this.schoolRepo.save(newSchool);
      if (!result) throw new BadRequestException('Unable to create school');
      return result;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async update(
    id: string,
    payload: UpdateSchoolDto,
    file: Express.Multer.File,
  ) {
    try {
      const school = await this.schoolRepo.findOne({ where: { id } });
      if (!school)
        throw new BadRequestException(`School with id ${id} not found`);

      let imageUrl = school.image;
      if (file) {
        imageUrl = await this.storeSchoolImage(file);
      }

      const updatedSchool = { ...school, ...payload, image: imageUrl };
      const result = await this.schoolRepo.save(updatedSchool);
      if (!result) throw new BadRequestException('Unable to update school');
      return result;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findAll(search?: string): Promise<School[]> {
    try {
      const queryBuilder = this.schoolRepo.createQueryBuilder('school');
      if (search) {
        queryBuilder.where('LOWER(school.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }
      const schools = await queryBuilder.getMany();
      return schools;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
  async findAllByPagination(
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: School[]; total: number; page: number; limit: number }> {
    try {
      const queryBuilder = this.schoolRepo.createQueryBuilder('school');

      // Apply search if provided
      if (search) {
        queryBuilder.where('LOWER(school.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      // Apply pagination only if page and limit are provided
      if (page && limit) {
        queryBuilder.skip((page - 1) * limit).take(limit);
      }

      // Get data and count total
      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async findOne(id: string): Promise<School> {
    try {
      const school = await this.schoolRepo.findOne({ where: { id } });
      if (!school) {
        throw new BadRequestException(`School with id ${id} not found`);
      }
      return school;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  private async storeSchoolImage(file: Express.Multer.File | undefined) {
    try {
      if (!file) {
        return null;
      }
      const uploadedFile = await this.cloudinaryService.uploadFile(
        file,
        'school_image',
      );
      return uploadedFile.url;
    } catch (error) {
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
