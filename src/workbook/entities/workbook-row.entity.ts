import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workbook_rows')
@Index('UQ_workbook_rows_sheet_row', ['sheetId', 'rowNumber'], { unique: true })
export class WorkbookRow {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid')
  sheetId!: string;

  @Column()
  rowNumber!: number;

  @Column('jsonb')
  values!: Record<string, unknown>;
}
