import { Role } from 'src/core/enums/role.enum';
import { Product } from 'src/product/entities/product.entity';
import { Rating } from 'src/rating/entities/rating.entity';
import { School } from 'src/school/entities/school.entity';
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

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Column({ primary: true, type: 'uuid' })
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  featured: boolean;

  @Column({ type: Number, default: 0, nullable: true })
  contact_count: number;

  @Column()
  password: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ nullable: true })
  identification: string;

  @Column({ nullable: true })
  matric_no: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  level: string;

  @Column({ nullable: true })
  description: string;

  @Column({ enum: Role, default: Role.BUYER, nullable: true })
  user_type: Role;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_merchant_verified: boolean;

  @Column({ nullable: true })
  user_status: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_account_name: string;

  @Column({ nullable: true })
  verification_otp: string;

  @ManyToOne(() => School, (school) => school.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Rating, (rating) => rating.ratedBy)
  ratings: Rating[];

  @Column({ nullable: true })
  reset_token: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_created_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
