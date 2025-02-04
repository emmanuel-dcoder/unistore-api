import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  user_type;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description;
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
export class UpdateBankDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_account_number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_name;
}
