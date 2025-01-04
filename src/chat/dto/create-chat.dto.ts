import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { Any } from 'typeorm';

export class SendMessageDto {
  @IsUUID()
  sender: string;

  @IsUUID()
  receiver: string;

  @IsString()
  @Length(1, 500)
  message: string;

  @IsString()
  user_type: string;

  @IsString()
  attachment: any;
}

export class CreateChatDto {
  @ApiProperty()
  @IsString()
  chat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sender: string;
}

export class GetMessagesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  merchant: string;
}

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  name: string;
}

export class ChatDto {
  @ApiProperty({
    description: 'Chat ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: 'User involved in the chat',
    type: UserDto,
  })
  user: any;

  @ApiProperty({
    description: 'Merchant involved in the chat',
  })
  merchant: any;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({ description: 'Message content', example: 'Hello there!' })
  message: string;

  @ApiProperty({
    description: 'Details of the sender',
  })
  sender: any;

  @ApiProperty({
    description: 'Chat details associated with the message',
  })
  chat: any;

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: '2025-01-04T12:34:56.789Z',
  })
  created_at: Date;
}
