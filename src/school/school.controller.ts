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
  Delete,
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
        name: {
          type: 'string',
          description: 'Name of the school',
        },
        abbreviation: {
          type: 'string',
          description: 'abbreviation of the school',
        },
        description: {
          type: 'string',
          description: 'description of the school',
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Update a school with an image, the keyword is "file"',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          description: 'Name of the school',
        },
      },
    },
  })
  @ApiBody({ type: UpdateSchoolDto })
  @ApiParam({ name: 'id', description: 'ID of the school to update' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
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

  @Get('pagination')
  @ApiOperation({
    summary: 'Get all schools with optional search and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering schools',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default is 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default is 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schools retrieved successfully with pagination',
  })
  async findAllByPagination(
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const data = await this.schoolService.findAllByPagination(
        search,
        page,
        limit,
      );
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a school by ID' })
  @ApiParam({ name: 'id', description: 'ID of the school to delete' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'School deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'School not found',
  })
  async delete(@Param('id') id: string) {
    try {
      await this.schoolService.delete(id);
      return successResponse({
        message: 'School deleted successfully',
        code: HttpStatus.OK,
        status: 'success',
      });
    } catch (error) {
      this.logger.error(`Error deleting school with ID ${id}`, error.message);
      throw error;
    }
  }
}
