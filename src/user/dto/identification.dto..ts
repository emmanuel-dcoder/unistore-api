import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class IdentificationDto {
  @ApiProperty()
  @ApiPropertyOptional()
  matric_no: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  department: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  level: string;
}
