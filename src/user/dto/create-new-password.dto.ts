import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CreateNewPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  new_password: string;
}

export class PasswordUserChangeDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'oldPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, {
    message: 'Current password must be at least 6 characters long',
  })
  currentPassword: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'newPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, {
    message: 'Confirm password must be at least 6 characters long',
  })
  confirmPassword: string;
}
