import { ConfigService } from '@nestjs/config';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import type { Repository } from 'typeorm';
import type { DanaService } from '../dana/dana.service';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { LogManager } from '../common/logger/log-manager.service';
import type { MinioService } from '../storage/minio.service';
import { WorkbookAnalysis } from './entities/workbook-analysis.entity';
import { WorkbookRow } from './entities/workbook-row.entity';
import { WorkbookSheetEntity } from './entities/workbook-sheet.entity';
import { Workbook } from './entities/workbook.entity';
import { WorkbookService } from './workbook.service';

describe('WorkbookService', () => {
  const setup = () => {
    let jobId = 0;
    const workbooks: Workbook[] = [];
    const sheets: WorkbookSheetEntity[] = [];
    const rows: WorkbookRow[] = [];
    const analyses: WorkbookAnalysis[] = [];
    const workbookRepository = {
      create: (value: Partial<Workbook>) => Object.assign(new Workbook(), value),
      save: (value: Workbook) => {
        value.jobId ||= ++jobId;
        value.createdAt ||= new Date('2026-08-11T10:30:00.000Z');
        value.updatedAt = new Date('2026-08-11T10:30:03.000Z');
        if (!workbooks.includes(value)) workbooks.push(value);
        return Promise.resolve(value);
      },
      findOneBy: ({ workbookId }: Partial<Workbook>) => Promise.resolve(workbooks.find((item) => item.workbookId === workbookId) ?? null),
    } as unknown as Repository<Workbook>;
    const sheetRepository = {
      create: (value: Partial<WorkbookSheetEntity>) => Object.assign(new WorkbookSheetEntity(), value),
      save: (values: WorkbookSheetEntity[]) => {
        sheets.push(...values);
        return Promise.resolve(values);
      },
      find: ({ where }: { where: Partial<WorkbookSheetEntity> }) => Promise.resolve(sheets.filter((item) => item.workbookId === where.workbookId)),
      findOneBy: ({ sheetId }: Partial<WorkbookSheetEntity>) => Promise.resolve(sheets.find((item) => item.sheetId === sheetId) ?? null),
    } as unknown as Repository<WorkbookSheetEntity>;
    const rowRepository = {
      create: (value: Partial<WorkbookRow>) => Object.assign(new WorkbookRow(), value),
      save: (values: WorkbookRow[]) => {
        rows.push(...values);
        return Promise.resolve(values);
      },
      findAndCount: ({ where, skip, take }: { where: Partial<WorkbookRow>; skip: number; take: number }) => {
        const found = rows.filter((item) => item.sheetId === where.sheetId);
        return Promise.resolve([found.slice(skip, skip + take), found.length] as [WorkbookRow[], number]);
      },
    } as unknown as Repository<WorkbookRow>;
    const analysisRepository = {
      create: (value: Partial<WorkbookAnalysis>) => Object.assign(new WorkbookAnalysis(), value),
      save: (value: WorkbookAnalysis) => {
        if (!analyses.includes(value)) analyses.push(value);
        return Promise.resolve(value);
      },
      findOneBy: ({ analysisId }: Partial<WorkbookAnalysis>) => Promise.resolve(analyses.find((item) => item.analysisId === analysisId) ?? null),
    } as unknown as Repository<WorkbookAnalysis>;
    const minio = {
      upload: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      preview: jest.fn().mockImplementation(() => Promise.resolve({ stream: Readable.from('Product,Quantity\nLaptop,12\nMonitor,8'), size: 38 })),
    } as unknown as MinioService;
    const service = new WorkbookService(
      workbookRepository,
      sheetRepository,
      rowRepository,
      analysisRepository,
      minio,
      { stream: jest.fn().mockResolvedValue('پاسخ تحلیل') } as unknown as DanaService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' }),
      { translate: (key: string) => key } as unknown as I18nMessageService,
      { info: jest.fn(), failure: jest.fn() } as unknown as LogManager
    );
    return { service, workbooks, sheets, rows };
  };

  it('queues and parses an uploaded CSV workbook', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workbook-test-'));
    const path = join(directory, 'sales.csv');
    await writeFile(path, 'Product,Quantity\nLaptop,12\nMonitor,8');
    const { service, workbooks, sheets, rows } = setup();

    const response = await service.create({ path, originalname: 'sales.csv', mimetype: 'text/csv', size: 38 } as Express.Multer.File, 'user', 'org-123');
    await new Promise((resolve) => setImmediate(resolve));

    expect(response).toMatchObject({ jobId: `parse-${response.workbookId}`, status: 'queued' });
    expect(workbooks[0]).toMatchObject({ status: 'ready', username: 'user', organizationId: 'org-123' });
    expect(sheets[0]).toMatchObject({ sheetName: 'Sheet1', rowTotal: 2, columnTotal: 2 });
    expect(rows.map(({ values }) => values)).toEqual([
      { Product: 'Laptop', Quantity: 12 },
      { Product: 'Monitor', Quantity: 8 },
    ]);
    await rm(directory, { recursive: true, force: true });
  });

  it('returns canonical sheets and paginated rows', async () => {
    const { service, workbooks, sheets, rows } = setup();
    const workbook = Object.assign(new Workbook(), { workbookId: 'workbook-id', versionId: 'version-id', username: 'user', organizationId: 'org', status: 'ready' });
    const sheet = Object.assign(new WorkbookSheetEntity(), {
      sheetId: 'sheet-id',
      workbookId: 'workbook-id',
      username: 'user',
      sheetName: 'Sales',
      sheetIndex: 0,
      rowTotal: 2,
      columnTotal: 2,
    });
    workbooks.push(workbook);
    sheets.push(sheet);
    rows.push(
      Object.assign(new WorkbookRow(), { sheetId: 'sheet-id', rowNumber: 2, values: { Product: 'Laptop' } }),
      Object.assign(new WorkbookRow(), { sheetId: 'sheet-id', rowNumber: 3, values: { Product: 'Monitor' } })
    );

    await expect(service.getSheets('workbook-id', 'user', 'org')).resolves.toEqual({
      sheets: [{ sheet_id: 'sheet-id', name: 'Sales', index: 0, row_count: 2, column_count: 2 }],
    });
    await expect(service.getRows('sheet-id', 'user', 'org', 1, 1)).resolves.toEqual({ rows: [{ Product: 'Monitor' }], offset: 1, limit: 1, total: 2 });
  });
});
