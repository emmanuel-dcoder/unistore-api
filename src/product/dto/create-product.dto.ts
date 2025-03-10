import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsUUID()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsNotEmpty()
  files: string[];

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  unit_sold: number;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  stock_quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  discount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_description: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  avg_rating: number;

  @ApiPropertyOptional()
  @IsString()
  fixed_price: string;

  @ApiPropertyOptional()
  @IsString()
  price_range: string;

  @ApiPropertyOptional()
  @IsString()
  custom_range: string;
}

export class AdminProductDto {
  @IsUUID()
  @ApiProperty()
  @IsString()
  merchantId: string;

  @IsUUID()
  @ApiProperty()
  @IsString()
  schoolId: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsUUID()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsNotEmpty()
  files: string[];

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  unit_sold: number;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  stock_quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_description: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  avg_rating: number;
}

export enum ProductStatus {
  VERIFIED = 'verified',
  NOT_VERIFIED = 'not-verified',
}
