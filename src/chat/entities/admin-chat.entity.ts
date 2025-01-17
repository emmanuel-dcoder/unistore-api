import { Admin } from 'src/admin/entities/admin.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
@Unique(['admin', 'merchant'])
export class AdminChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  last_message: string;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'merchant_id' })
  merchant: User;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
