import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Chat } from './chat.entity';
import { SelectionMode } from '../enums/selection-mode.enum';
import { AnswerStatus } from '../enums/answer-status.enum';

@Entity('chat_messages')
@Unique('UQ_chat_messages_sequence', ['chatId', 'sequence'])
export class ChatMessage {
  @PrimaryColumn()
  id!: string;

  @Column('uuid')
  chatId!: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'chatId',
    foreignKeyConstraintName: 'FK_chat_messages_chat',
  })
  chat!: Relation<Chat>;

  @Column()
  sequence!: number;

  @Column({ default: true })
  unread!: boolean;

  @Column({ default: 'text' })
  type!: string;

  @Column({ nullable: true })
  selectionMode?: SelectionMode;

  @Column({ nullable: true })
  messageType?: SelectionMode;

  @Column('text')
  message!: string;

  @Column('text', { default: '' })
  text!: string;

  @Column()
  bot!: boolean;

  @Column({ type: 'enum', enum: AnswerStatus, default: AnswerStatus.COMPLETED })
  answerStatus!: AnswerStatus;

  @Column({ default: '' })
  avatar!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments!: unknown[];

  @Column({ default: false })
  liked!: boolean;

  @Column({ default: false })
  disLiked!: boolean;

  @Column({ default: false })
  starred!: boolean;

  @Column({ default: false })
  delivered!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: '' })
  comment!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  translate!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  reply!: unknown[];
}
