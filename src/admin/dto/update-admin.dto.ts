import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class UpdateAdminDto {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  first_name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  sex: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsBoolean()
  @IsNotEmpty()
  is_active: Boolean;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  date_of_birth: Date;
}
