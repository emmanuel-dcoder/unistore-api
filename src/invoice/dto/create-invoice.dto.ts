import { Optional } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class InvoicePayloadDto {
  @ApiProperty()
  @IsNotEmpty()
  products: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  total_price: number;

}
