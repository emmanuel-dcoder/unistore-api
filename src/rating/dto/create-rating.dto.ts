import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  rating_number: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  product: string;
}
