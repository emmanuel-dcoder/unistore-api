import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { School } from './entities/school.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { UpdateSchoolDto } from './dto/update-school.dto';

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
      imageUrl = await this.storeSchoolImage(file); // Store the image and get the file name
    }

    const newSchool = { ...payload, image: imageUrl };
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
