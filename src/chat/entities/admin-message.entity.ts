import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { AdminChat } from './admin-chat.entity';

@Entity()
export class AdminMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdminChat)
  @JoinColumn({ name: 'chat_id' })
  chat: AdminChat;

  @Column('text', { nullable: true })
  message: string;

  @Column('text', { nullable: true })
  attachment: string;

  @Column('uuid', { nullable: false })
  sender: string;

  @Column('text', { nullable: false })
  senderType: 'User' | 'Admin';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
