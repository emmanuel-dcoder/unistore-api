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
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  invoice_id: string;

  @Column({ nullable: true })
  products: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'product_owner_id' })
  product_owner: User;

  @Column({ nullable: true, type: 'decimal' })
  total_price: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'json', nullable: true })
  payment_details: Record<string, any>;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  reference: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
