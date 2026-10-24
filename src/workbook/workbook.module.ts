import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { Workbook } from './entities/workbook.entity';
import { WorkbookSheetEntity } from './entities/workbook-sheet.entity';
import { WorkbookSheetsController } from './workbook-sheets.controller';
import { WorkbookRow } from './entities/workbook-row.entity';
import { WorkbookAnalysis } from './entities/workbook-analysis.entity';
import { DanaModule } from '../dana/dana.module';
import { WorkbookAnalysesController } from './workbook-analyses.controller';
import { WorkbookController } from './workbook.controller';
import { WorkbookService } from './workbook.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workbook, WorkbookSheetEntity, WorkbookRow, WorkbookAnalysis]), AuthModule, StorageModule, DanaModule],
  controllers: [WorkbookController, WorkbookSheetsController, WorkbookAnalysesController],
  providers: [WorkbookService],
})
export class WorkbookModule {}
