import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('workbooks')
@Index('UQ_workbooks_workbook_id', ['workbookId'], { unique: true })
export class Workbook {
  @PrimaryGeneratedColumn()
  jobId!: number;

  @Column('uuid')
  workbookId!: string;

  @Column('uuid')
  versionId!: string;

  @Column()
  organizationId!: string;

  @Column()
  username!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column('bigint')
  size!: string;

  @Column({ length: 64 })
  sha256!: string;

  @Column()
  bucket!: string;

  @Column()
  objectKey!: string;

  @Column({ default: 1 })
  currentVersion!: number;

  @Column({ default: 'queued' })
  status!: string;

  @Column('text', { nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
