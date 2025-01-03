import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/core/enums/role.enum';
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verification_otp;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  school;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  user_type;
}

export class UpdateUserRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_type: Role;
}

export class UpdateUserSchoolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  school: string;
}
