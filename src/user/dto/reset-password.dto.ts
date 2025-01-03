import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reset_token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  new_password: string;
}
