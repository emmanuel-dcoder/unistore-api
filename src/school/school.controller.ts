import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/core/common';

@Controller('school')
@ApiTags('University/School')
export class SchoolController {
  private readonly logger = new Logger(SchoolController.name);
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @ApiOperation({ summary: 'Reset password with the token provided' })
  @ApiBody({ type: CreateSchoolDto })
  @ApiResponse({ status: 200, description: 'School created successful' })
  @ApiResponse({ status: 401, description: 'Unable to create school.' })
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    try {
      const data = await this.schoolService.create(createSchoolDto);
      return successResponse({
        message: 'School created successful',
        code: HttpStatus.OK,
        status: 'success',
        data,
      });
    } catch (error) {
      this.logger.error('Error', error.message);
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
