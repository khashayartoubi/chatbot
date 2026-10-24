import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_prompts')
@Index('IDX_user_prompts_username', ['username'])
@Index('UQ_user_prompts_active_username', ['username'], { unique: true, where: '"isActive" = true' })
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  promptId!: string;

  @Column()
  username!: string;

  @Column()
  name!: string;

  @Column('text')
  prompt!: string;

  @Column({ default: false })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
