import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsNotEmpty()
  files: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unit_sold: number;

  @ApiProperty()
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
}
