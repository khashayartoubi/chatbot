import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DefaultLanguage } from '../enums/default-language.enum';
import { FontSize } from '../enums/font-size.enum';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ type: 'varchar', default: FontSize.MEDIUM })
  fontSize!: FontSize;

  @Column({
    type: 'varchar',
    default: DefaultLanguage.PERSIAN,
  })
  defaultLanguage!: DefaultLanguage;

  @UpdateDateColumn()
  updatedAt!: Date;
}
