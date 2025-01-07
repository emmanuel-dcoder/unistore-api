import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Get,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Controller('api/v1/school')
@ApiTags('University/School')
export class SchoolController {
  private readonly logger = new Logger(SchoolController.name);
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Create a new school with an file image, the keyword is "file"',
  })
  @ApiBody({ type: CreateSchoolDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'School created successfully' })
  @ApiResponse({ status: 401, description: 'Unable to create school' })
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const data = await this.schoolService.create(createSchoolDto, file);
      return successResponse({
        message: 'School created successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
      throw error;
    }
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file')) // Image field in the form
  @ApiOperation({
    summary: 'Update a school with an image, the keyword is "file"',
  })
  @ApiBody({ type: UpdateSchoolDto })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID of the school to update' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSchoolDto: CreateSchoolDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const data = await this.schoolService.update(id, updateSchoolDto, file);
      return successResponse({
        message: 'School updated successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error(`Error updating school with ID ${id}`, error.message);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all schools with optional search' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering schools',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schools retrieved successfully',
  })
  async findAll(@Query('search') search?: string) {
    try {
      const data = await this.schoolService.findAll(search);
      return successResponse({
        message: 'Schools retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error fetching schools', error.message);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single school by ID' })
  @ApiParam({ name: 'id', description: 'ID of the school to retrieve' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'School retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'School not found',
  })
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.schoolService.findOne(id);
      return successResponse({
        message: 'School retrieved successfully',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error(`Error fetching school with ID ${id}`, error.message);
      throw error;
    }
  }
}
