import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class UpdateAdminDto {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  first_name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  sex: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsBoolean()
  @IsNotEmpty()
  is_active: Boolean;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  date_of_birth: Date;
}

export class MerchantPaginationDto {
  @ApiPropertyOptional({ type: Number, default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Search query',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;
}
