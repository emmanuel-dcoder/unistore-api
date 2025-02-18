import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: User;

  @Column({ nullable: true, type: 'decimal' })
  amount: number;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_withdrawn: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  withdrawal_approved: boolean;

  @Column({ type: 'boolean', default: true, nullable: true })
  withdrawal_request: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
