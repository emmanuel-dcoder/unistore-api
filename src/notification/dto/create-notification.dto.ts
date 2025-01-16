import { ApiProperty } from '@nestjs/swagger';
import { IsString, Min } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;
}
