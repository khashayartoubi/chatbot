import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Chat } from '../../stream/entities/chat.entity';
import { Upload } from '../../uploads/entities/upload.entity';

@Entity('projects')
@Index('IDX_projects_collectionId', ['collectionId'], { unique: true })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  collectionId!: string;

  @Column()
  name!: string;

  @Column({ default: '#3B82F6' })
  color!: string;

  @Column({ default: '' })
  icon!: string;

  @Column()
  username!: string;

  @Column({ default: false })
  pinned!: boolean;

  @OneToMany(() => Chat, (chat) => chat.project)
  chats!: Relation<Chat[]>;

  @OneToMany(() => Upload, (upload) => upload.project)
  uploads!: Relation<Upload[]>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
