import { BadRequestException, Injectable } from '@nestjs/common';
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
    const { name } = payload;
    const validateSchool = await this.schoolRepo.findOne({ where: { name } });
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
  }

  async update(
    id: string,
    payload: UpdateSchoolDto,
    file: Express.Multer.File,
  ) {
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
  }

  async findAll(search?: string): Promise<School[]> {
    const queryBuilder = this.schoolRepo.createQueryBuilder('school');
    if (search) {
      queryBuilder.where('LOWER(school.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }
    const schools = await queryBuilder.getMany();
    return schools;
  }

  async findAllByPagination(
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: School[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.schoolRepo.createQueryBuilder('school');

    if (search) {
      queryBuilder.where('LOWER(school.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw new BadRequestException(`School with id ${id} not found`);
    }
    return school;
  }

  private async storeSchoolImage(file: Express.Multer.File | undefined) {
    if (!file) {
      return null;
    }
    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      'school_image',
    );
    return uploadedFile.url;
  }
}
