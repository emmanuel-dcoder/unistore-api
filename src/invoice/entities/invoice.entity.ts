import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'product_owner_id' })
  product_owner: User;

  @Column({ default: 1 })
  quantity: number;

  @Column('decimal')
  total_price: number;

  @Column({ type: 'decimal', nullable: true })
  discount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'json', nullable: true })
  virtualAccountDetails: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
