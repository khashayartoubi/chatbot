import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BackgroundFit } from '../enums/background-fit.enum';

@Entity('user_backgrounds')
export class Background {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ nullable: true })
  objectName?: string;

  @Column({ nullable: true })
  fullPath?: string;

  @Column({ nullable: true })
  originalName?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ default: '#3B82F6' })
  userMessageBackgroundColor!: string;

  @Column({ default: '#FFFFFF' })
  userMessageTextColor!: string;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'varchar', default: BackgroundFit.COVER })
  fit!: BackgroundFit;

  @Column({ default: '#F5827A66' })
  overlay!: string;

  @Column({ default: true })
  blur!: boolean;

  @Column({ default: true })
  applyToAll!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
