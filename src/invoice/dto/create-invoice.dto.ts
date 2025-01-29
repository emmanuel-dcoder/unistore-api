import { Optional } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class InvoicePayloadDto {
  @ApiProperty()
  @IsNotEmpty()
  products: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  total_price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_email;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_name;
}
