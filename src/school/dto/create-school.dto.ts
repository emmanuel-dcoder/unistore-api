import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
