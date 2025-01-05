import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class InvoicePayloadDto {
  @IsUUID() // Ensures productId is a valid UUID
  @IsNotEmpty()
  productId: string;

  @IsNumber() // Ensures quantity is a number
  @IsNotEmpty()
  quantity: number;
}

export class OrderPayloadDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  user: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  billing_address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zip_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  invoices: InvoicePayloadDto[];

  @ApiProperty()
  @ValidateNested({ each: true })
  createOrder: OrderPayloadDto;
}
