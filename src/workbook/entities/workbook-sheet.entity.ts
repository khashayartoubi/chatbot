import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('workbook_sheets')
@Index('UQ_workbook_sheets_workbook_index', ['workbookId', 'sheetIndex'], { unique: true })
export class WorkbookSheetEntity {
  @PrimaryColumn('uuid')
  sheetId!: string;

  @Column('uuid')
  workbookId!: string;

  @Column('uuid')
  versionId!: string;

  @Column()
  username!: string;

  @Column()
  sheetName!: string;

  @Column('integer')
  sheetIndex!: number;

  @Column('integer', { default: 1 })
  headerRow!: number;

  @Column('integer', { name: 'rowCount', default: 0 })
  rowTotal!: number;

  @Column('integer', { name: 'columnCount', default: 0 })
  columnTotal!: number;

  @Column({ default: false })
  hidden!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  headers!: string[];
}
