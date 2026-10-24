import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChatType } from '../enums/chat-type.enum';
import { ChatMessage } from './chat-message.entity';
import { AnswerStatus } from '../enums/answer-status.enum';

@Entity('chats')
@Index('IDX_chats_session', ['username', 'sessionId'])
@Index('IDX_chats_general_history', ['username', 'historyId'])
@Index('IDX_chats_projectId', ['projectId'])
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ChatType })
  type!: ChatType;

  @Column()
  username!: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  historyId?: string;

  @Column({ type: 'uuid', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, (project) => project.chats, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'projectId',
    foreignKeyConstraintName: 'FK_chats_project',
  })
  project?: Relation<Project>;

  @OneToMany(() => ChatMessage, (message) => message.chat)
  messages!: Relation<ChatMessage[]>;

  @Column({ default: '' })
  historyName!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  translate!: string[];

  @Column({ default: false })
  reasoning!: boolean;

  @Column({ default: 'gemma4:31b' })
  modelName!: string;

  @Column({ default: 'done' })
  state!: string;

  @Column({ default: false })
  waiting!: boolean;

  @Column({ type: 'enum', enum: AnswerStatus, default: AnswerStatus.COMPLETED })
  answerStatus!: AnswerStatus;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  pinned!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
