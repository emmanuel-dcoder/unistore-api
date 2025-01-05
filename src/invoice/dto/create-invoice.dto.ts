import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  billing_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zip_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  discount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
