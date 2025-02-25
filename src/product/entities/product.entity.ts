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
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinTable,
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

  @Column({ nullable: true, default: false })
  is_approved: boolean;

  @ManyToOne(() => Category, (category) => category.products, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  category: Category;

  @Column('text', { array: true, nullable: true })
  product_image: string[];

  @Column({ nullable: true })
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

  @Column({ nullable: true })
  fixed_price: string;

  @Column({ nullable: true })
  price_range: string;

  @Column({ nullable: true })
  custom_range: string;

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

  @ManyToOne(() => School, (school) => school.product, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => Rating, (rating) => rating.id, { nullable: true })
  @JoinColumn({ name: 'rating_id' })
  rating: Rating[];

  @ManyToMany(() => User, { cascade: true, nullable: true })
  @JoinTable({
    name: 'product_views',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  product_views: User[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
