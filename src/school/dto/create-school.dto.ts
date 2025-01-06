import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSchoolDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty()
  @IsNotEmpty()
  name: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty()
  @IsNotEmpty()
  file: string;
}
