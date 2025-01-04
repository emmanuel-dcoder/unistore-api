import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateChatDto {
  @ApiProperty()
  @IsString()
  chat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sender: string;
}
