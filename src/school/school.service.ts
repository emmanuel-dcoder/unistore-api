import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { School } from './entities/school.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
  ) {}

  async create(payload: CreateSchoolDto) {
    const { name } = payload;
    const validateSchool = await this.schoolRepo.findOne({ where: { name } });
    if (validateSchool)
      throw new BadRequestException(
        'This university/school name already exist',
      );
    const result = await this.schoolRepo.save(payload);
    if (!result) throw new BadRequestException('Unable to create school');
    return result;
  }

  // Fetch schools with optional search
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

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw new BadRequestException(`School with id ${id} not found`);
    }
    return school;
  }
}
