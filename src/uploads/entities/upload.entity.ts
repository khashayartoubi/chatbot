import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { UploadStatus } from '../enums/upload-status.enum';
import { FileState } from '../enums/file-state.enum';
import { FileTag } from '../../storage/enums/file-tag.enum';

@Entity('uploads')
@Index('IDX_uploads_fileId', ['fileId'], { unique: true })
@Index('IDX_uploads_general_history', ['username', 'historyId'])
@Index('IDX_uploads_projectId', ['projectId'])
@Index('IDX_uploads_sourceFileId', ['sourceFileId'])
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  uploadId!: string;

  @Column()
  fileId!: string;

  @Column()
  username!: string;

  @Column()
  filename!: string;

  @Column({ type: 'uuid', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, (project) => project.uploads, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'projectId',
    foreignKeyConstraintName: 'FK_uploads_project',
  })
  project?: Relation<Project>;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  historyId?: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column('bigint')
  size!: number;

  @Column({ type: 'enum', enum: UploadStatus, default: UploadStatus.QUEUED })
  status!: UploadStatus;

  @Column({ nullable: true })
  objectName?: string;

  @Column({ default: 'dana-client' })
  bucket!: string;

  @Column({ default: FileTag.USER })
  tag!: FileTag;

  @Column({ nullable: true })
  sourceFileId?: string;

  @ManyToOne(() => Upload, (upload) => upload.generatedFiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'sourceFileId',
    referencedColumnName: 'fileId',
    foreignKeyConstraintName: 'FK_uploads_source_file',
  })
  sourceFile?: Relation<Upload>;

  @OneToMany(() => Upload, (upload) => upload.sourceFile)
  generatedFiles!: Relation<Upload[]>;

  @Column({ nullable: true })
  fullPath?: string;

  @Column({ type: 'enum', enum: FileState, default: FileState.PENDING })
  state!: FileState;

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  uploadedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
