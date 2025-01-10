import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Column,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  @OneToMany(() => Invoice, (invoice) => invoice.order)
  invoices: Invoice[];

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'product_owner_id' })
  product_owner: User;

  @Column({ nullable: true, type: 'decimal' })
  total_price: number;

  @Column({ type: 'decimal', nullable: true })
  discount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  billing_address: string;

  @Column({ nullable: true })
  zip_code: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'json', nullable: true })
  payment_details: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  virtualAccountDetails: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
