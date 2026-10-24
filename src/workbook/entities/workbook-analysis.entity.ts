import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('workbook_analyses')
@Index('IDX_workbook_analyses_owner', ['username', 'organizationId'])
export class WorkbookAnalysis {
  @PrimaryColumn('uuid')
  analysisId!: string;

  @Column('uuid')
  workbookId!: string;

  @Column('uuid')
  versionId!: string;

  @Column()
  organizationId!: string;

  @Column()
  username!: string;

  @Column('text')
  question!: string;

  @Column()
  chartRequested!: boolean;

  @Column('text')
  selectedCells!: string;

  @Column({ default: 'queued' })
  status!: string;

  @Column('jsonb', { nullable: true })
  result!: { answer: string; chart?: unknown; changes?: unknown[] } | null;

  @Column('text', { nullable: true })
  error!: string | null;

  @Column('varchar', { nullable: true })
  idempotencyKey!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
