import { Category } from 'src/category/entities/category.entity';
import { Rating } from 'src/rating/entities/rating.entity';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStatus } from '../dto/create-product.dto';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @Column({ primary: true, type: 'uuid' })
  id: string;

  @Column()
  product_name: string;

  @Column({ nullable: true })
  product_id: string;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  category: Category;

  @Column('text', { array: true, nullable: true })
  product_image: string[];

  @Column()
  product_description: string;

  @Column({ nullable: true })
  unit_sold: number;

  @Column()
  stock_quantity: number;

  @Column({ type: 'boolean', default: false, nullable: true })
  featured: boolean;

  @Column()
  condition: string;

  @Column({ type: 'decimal', nullable: true })
  price: number;

  @Column({ type: 'decimal', nullable: true })
  discount: number;

  @Column({ type: 'decimal', nullable: true })
  avg_rating: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.NOT_VERIFIED,
    nullable: true,
  })
  status: ProductStatus;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => School, (school) => school.product, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => Rating, (rating) => rating.id, { nullable: true })
  @JoinColumn({ name: 'rating_id' })
  rating: Rating[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
