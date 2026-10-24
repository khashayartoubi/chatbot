import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { LogManager } from '../common/logger/log-manager.service';
import { normalizeFileName } from '../common/utils/normalize-file-name';
import { DanaService } from '../dana/dana.service';
import { AppHttpException } from '../error/exceptions/app-http.exception';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';
import { FileTag } from '../storage/enums/file-tag.enum';
import { MinioService } from '../storage/minio.service';
import { userObjectName } from '../storage/utils/user-object-name';
import { Upload } from '../uploads/entities/upload.entity';
import { SelectionMode } from '../stream/enums/selection-mode.enum';
import { WORKBOOK_FILE_EXTENSIONS, WORKBOOK_FILE_MIME_TYPES } from './constants/workbook-file.constants';
import type { CreateAnalysisDto } from './dto/create-analysis.dto';
import { WorkbookAnalysis } from './entities/workbook-analysis.entity';
import { WorkbookRow } from './entities/workbook-row.entity';
import { WorkbookSheetEntity } from './entities/workbook-sheet.entity';
import { Workbook } from './entities/workbook.entity';
import type { SheetRowsResponse } from './interfaces/sheet-rows-response.interface';
import type { CreateWorkbookResult, WorkbookResult, WorkbookSheetsResult } from './interfaces/workbook-api.interface';

@Injectable()
export class WorkbookService {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbooksRepository: Repository<Workbook>,
    @InjectRepository(WorkbookSheetEntity)
    private readonly sheetsRepository: Repository<WorkbookSheetEntity>,
    @InjectRepository(WorkbookRow)
    private readonly rowsRepository: Repository<WorkbookRow>,
    @InjectRepository(WorkbookAnalysis)
    private readonly analysesRepository: Repository<WorkbookAnalysis>,
    private readonly minioService: MinioService,
    private readonly danaService: DanaService,
    private readonly configService: ConfigService,
    private readonly messages: I18nMessageService,
    private readonly logger: LogManager
  ) {}

  async create(file: Express.Multer.File, username: string, organizationId: string): Promise<CreateWorkbookResult> {
    const extension = file.originalname.split('.').at(-1)?.toLowerCase() ?? '';
    try {
      await this.validateFile(file, extension);
      const workbookId = randomUUID();
      const versionId = randomUUID();
      const originalName = normalizeFileName(file.originalname);
      const bucket = this.configService.get<string>('MINIO_BUCKET', 'dana-client');
      const objectKey = userObjectName('excel-assistant', organizationId, workbookId, `v1.${extension}`);
      const workbook = this.workbooksRepository.create({
        workbookId,
        versionId,
        organizationId,
        username,
        originalName,
        mimeType: file.mimetype,
        size: String(file.size),
        sha256: await this.sha256(file.path),
        bucket,
        objectKey,
        currentVersion: 1,
        status: 'queued',
        lastError: null,
      });

      try {
        await this.minioService.upload(file.path, objectKey, workbook.mimeType, bucket, FileTag.USER);
        await this.workbooksRepository.save(workbook);
      } catch (error) {
        await this.minioService.remove(objectKey, bucket).catch(() => undefined);
        if (error instanceof InfrastructureUnavailableException) {
          throw error;
        }
        throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.storeFailed', 'WORKBOOK_STORE_FAILED');
      }

      void this.parseWorkbook(workbook);
      return { workbookId, versionId, jobId: `parse-${workbookId}`, status: 'queued' };
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  async findOne(workbookId: string, username: string, organizationId: string): Promise<WorkbookResult> {
    return { workbook: this.workbookMetadata(await this.findOwnedWorkbook(workbookId, username, organizationId)) };
  }

  async getSheets(workbookId: string, username: string, organizationId: string): Promise<WorkbookSheetsResult> {
    const workbook = await this.findOwnedWorkbook(workbookId, username, organizationId);
    if (workbook.status !== 'ready') {
      return { sheets: [] };
    }
    try {
      const sheets = await this.sheetsRepository.find({ where: { workbookId }, order: { sheetIndex: 'ASC' } });
      return {
        sheets: sheets.map((sheet) => ({
          sheet_id: sheet.sheetId,
          name: sheet.sheetName,
          index: sheet.sheetIndex,
          row_count: this.databaseNumber(sheet.rowTotal),
          column_count: this.databaseNumber(sheet.columnTotal),
        })),
      };
    } catch {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.sheetsReadFailed', 'SHEETS_READ_FAILED');
    }
  }

  async getRows(sheetId: string, username: string, organizationId: string, offset: number, limit: number): Promise<SheetRowsResponse> {
    const sheet = await this.findOwnedSheet(sheetId, username);
    await this.findOwnedWorkbook(sheet.workbookId, username, organizationId);
    try {
      const [rows, total] = await this.rowsRepository.findAndCount({
        where: { sheetId },
        order: { rowNumber: 'ASC' },
        skip: offset,
        take: limit,
      });
      return { rows: rows.map((row) => row.values), offset, limit, total };
    } catch {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.rowsReadFailed', 'SHEET_ROWS_READ_FAILED');
    }
  }

  async createAnalysis(
    workbookId: string,
    dto: CreateAnalysisDto,
    username: string,
    organizationId: string,
    idempotencyKey?: string
  ): Promise<{ analysisId: string; status: string }> {
    const workbook = await this.findOwnedWorkbook(workbookId, username, organizationId);
    if (workbook.status !== 'ready') {
      throw this.error(HttpStatus.CONFLICT, 'workbook.notReady', 'WORKBOOK_NOT_READY');
    }
    if (workbook.versionId !== dto.versionId) {
      throw this.error(HttpStatus.CONFLICT, 'workbook.versionMismatch', 'VERSION_MISMATCH');
    }
    if (!dto.question.trim()) {
      throw this.error(HttpStatus.BAD_REQUEST, 'workbook.questionRequired', 'INVALID_QUESTION');
    }
    if (!this.validSelectedCells(dto.selectedCells)) {
      throw this.error(HttpStatus.BAD_REQUEST, 'workbook.invalidCellRange', 'INVALID_CELL_RANGE');
    }
    if (idempotencyKey) {
      const previous = await this.analysesRepository.findOneBy({ workbookId, username, idempotencyKey });
      if (previous) return { analysisId: previous.analysisId, status: previous.status };
    }

    const analysis = await this.analysesRepository.save(
      this.analysesRepository.create({
        analysisId: randomUUID(),
        workbookId,
        versionId: dto.versionId,
        organizationId,
        username,
        question: dto.question.trim(),
        chartRequested: dto.chartRequested,
        selectedCells: dto.selectedCells.trim(),
        status: 'queued',
        result: null,
        error: null,
        idempotencyKey: idempotencyKey ?? null,
      })
    );
    void this.runAnalysis(analysis, workbook);
    return { analysisId: analysis.analysisId, status: 'queued' };
  }

  async getAnalysis(analysisId: string, username: string, organizationId: string) {
    let analysis: WorkbookAnalysis | null;
    try {
      analysis = await this.analysesRepository.findOneBy({ analysisId });
    } catch {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.analysisReadFailed', 'ANALYSIS_READ_FAILED');
    }
    if (!analysis) throw this.error(HttpStatus.NOT_FOUND, 'workbook.analysisNotFound', 'ANALYSIS_NOT_FOUND');
    if (analysis.username !== username || analysis.organizationId !== organizationId) {
      throw this.error(HttpStatus.FORBIDDEN, 'workbook.analysisForbidden', 'ANALYSIS_FORBIDDEN');
    }
    return {
      analysisId: analysis.analysisId,
      status: analysis.status,
      ...(analysis.result ? { result: analysis.result } : {}),
      ...(analysis.error ? { error: analysis.error } : {}),
    };
  }

  private async parseWorkbook(workbook: Workbook): Promise<void> {
    try {
      this.logger.info(WorkbookService.name, this.messages.translate('workbook.parseStarted'), { workbookId: workbook.workbookId });
      workbook.status = 'processing';
      await this.workbooksRepository.save(workbook);
      const object = await this.minioService.preview(workbook.objectKey, workbook.bucket);
      const buffer = await this.readStream(object.stream);
      const parsed = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellFormula: true });
      const sheets: WorkbookSheetEntity[] = [];
      const rows: WorkbookRow[] = [];

      parsed.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = parsed.Sheets[sheetName];
        if (!worksheet) return;
        const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:A1');
        const columnCount = range.e.c + 1;
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: true, defval: null, blankrows: true });
        const headers = this.uniqueHeaders(matrix[0] ?? [], columnCount);
        const sheetId = this.deterministicId(`${workbook.workbookId}:${workbook.versionId}:${sheetIndex}`);
        const rowCount = Math.max(range.e.r, 0);
        sheets.push(
          this.sheetsRepository.create({
            sheetId,
            workbookId: workbook.workbookId,
            versionId: workbook.versionId,
            username: workbook.username,
            sheetName,
            sheetIndex,
            headerRow: 1,
            rowTotal: rowCount,
            columnTotal: columnCount,
            hidden: Boolean(parsed.Workbook?.Sheets?.[sheetIndex]?.Hidden),
            headers,
          })
        );
        for (let index = 0; index < rowCount; index++) {
          const values = matrix[index + 1] ?? [];
          rows.push(
            this.rowsRepository.create({
              sheetId,
              rowNumber: index + 2,
              values: Object.fromEntries(headers.map((header, columnIndex) => [header, this.jsonValue(values[columnIndex])])),
            })
          );
        }
      });

      await this.sheetsRepository.save(sheets);
      for (let index = 0; index < rows.length; index += 500) {
        await this.rowsRepository.save(rows.slice(index, index + 500));
      }
      workbook.status = 'ready';
      workbook.lastError = null;
      await this.workbooksRepository.save(workbook);
      this.logger.info(WorkbookService.name, this.messages.translate('workbook.parseCompleted'), { workbookId: workbook.workbookId });
    } catch (error) {
      workbook.status = 'failed';
      workbook.lastError = error instanceof Error ? error.message : this.messages.translate('workbook.parseFailed');
      await this.workbooksRepository.save(workbook).catch(() => undefined);
      this.logger.failure(WorkbookService.name, this.messages.translate('workbook.parseFailed'), error, { workbookId: workbook.workbookId });
    }
  }

  private async runAnalysis(analysis: WorkbookAnalysis, workbook: Workbook): Promise<void> {
    try {
      analysis.status = 'processing';
      await this.analysesRepository.save(analysis);
      const file = Object.assign(new Upload(), {
        username: workbook.username,
        filename: workbook.originalName,
        originalName: workbook.originalName,
        mimeType: workbook.mimeType,
        size: Number(workbook.size),
        bucket: workbook.bucket,
        objectName: workbook.objectKey,
      });
      const prompt = `${analysis.question}\n${this.messages.translate('workbook.selectedCells')}: ${analysis.selectedCells || this.messages.translate('workbook.allData')}\n${this.messages.translate('workbook.chart')}: ${this.messages.translate(analysis.chartRequested ? 'workbook.yes' : 'workbook.no')}`;
      const answer = await this.danaService.stream(
        {
          userQuery: prompt,
          username: analysis.username,
          history: [],
          historyCount: 0,
          selectionMode: SelectionMode.GENERAL_CHAT,
          files: [file],
        },
        () => undefined
      );
      analysis.status = 'completed';
      analysis.result = { answer, changes: [] };
      await this.analysesRepository.save(analysis);
    } catch (error) {
      analysis.status = 'failed';
      analysis.error = error instanceof Error ? error.message : this.messages.translate('workbook.analysisFailed');
      await this.analysesRepository.save(analysis).catch(() => undefined);
      this.logger.failure(WorkbookService.name, this.messages.translate('workbook.analysisFailed'), error, { analysisId: analysis.analysisId });
    }
  }

  private async findOwnedWorkbook(workbookId: string, username: string, organizationId: string): Promise<Workbook> {
    let workbook: Workbook | null;
    try {
      workbook = await this.workbooksRepository.findOneBy({ workbookId });
    } catch {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.readFailed', 'WORKBOOK_READ_FAILED');
    }
    if (!workbook) throw this.error(HttpStatus.NOT_FOUND, 'workbook.notFound', 'WORKBOOK_NOT_FOUND');
    if (workbook.username !== username || workbook.organizationId !== organizationId) {
      throw this.error(HttpStatus.FORBIDDEN, 'workbook.forbidden', 'WORKBOOK_FORBIDDEN');
    }
    return workbook;
  }

  private async findOwnedSheet(sheetId: string, username: string): Promise<WorkbookSheetEntity> {
    let sheet: WorkbookSheetEntity | null;
    try {
      sheet = await this.sheetsRepository.findOneBy({ sheetId });
    } catch {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.sheetReadFailed', 'SHEET_READ_FAILED');
    }
    if (!sheet) throw this.error(HttpStatus.NOT_FOUND, 'workbook.sheetNotFound', 'SHEET_NOT_FOUND');
    if (sheet.username !== username) throw this.error(HttpStatus.FORBIDDEN, 'workbook.sheetForbidden', 'SHEET_FORBIDDEN');
    return sheet;
  }

  private workbookMetadata(workbook: Workbook) {
    return {
      workbook_id: workbook.workbookId,
      organization_id: workbook.organizationId,
      username: workbook.username,
      original_name: workbook.originalName,
      object_key: workbook.objectKey,
      mime_type: workbook.mimeType,
      size: Number(workbook.size),
      sha256: workbook.sha256,
      status: workbook.status,
      current_version: workbook.currentVersion,
      last_error: workbook.lastError,
      created_at: workbook.createdAt.toISOString(),
      updated_at: workbook.updatedAt.toISOString(),
      version_id: workbook.versionId,
      version_object_key: workbook.objectKey,
    };
  }

  private databaseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private uniqueHeaders(values: unknown[], columnCount: number): string[] {
    const used = new Map<string, number>();
    return Array.from({ length: columnCount }, (_, index) => {
      const value = values[index];
      const base =
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value).trim() : '') ||
        `${this.messages.translate('workbook.column')} ${index + 1}`;
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);
      return count === 1 ? base : `${base} (${count})`;
    });
  }

  private jsonValue(value: unknown): unknown {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
    return JSON.parse(JSON.stringify(value)) as unknown;
  }

  private validSelectedCells(value: string): boolean {
    return !value.trim() || /^(?:[A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)(?:,\s*[A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)*$/i.test(value.trim());
  }

  private async validateFile(file: Express.Multer.File, extension: string): Promise<void> {
    if (!WORKBOOK_FILE_EXTENSIONS.has(extension) || !WORKBOOK_FILE_MIME_TYPES.has(file.mimetype)) {
      throw this.error(HttpStatus.BAD_REQUEST, 'workbook.invalidFileType', 'INVALID_FILE_TYPE');
    }
    const maxSize = this.configService.get<number>('UPLOAD_MAX_FILE_SIZE', 100 * 1024 * 1024);
    if (file.size > maxSize) throw this.error(HttpStatus.PAYLOAD_TOO_LARGE, 'workbook.fileTooLarge', 'FILE_TOO_LARGE');
    const handle = await open(file.path, 'r');
    const signature = Buffer.alloc(8);
    try {
      await handle.read(signature, 0, signature.length, 0);
    } finally {
      await handle.close();
    }
    const xlsxValid = extension !== 'xlsx' || signature.subarray(0, 2).toString() === 'PK';
    const xlsValid = extension !== 'xls' || signature.toString('hex').startsWith('d0cf11e0a1b11ae1');
    if (!xlsxValid || !xlsValid) throw this.error(HttpStatus.BAD_REQUEST, 'workbook.invalidFileSignature', 'INVALID_FILE_SIGNATURE');
  }

  private async sha256(path: string): Promise<string> {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path) as AsyncIterable<Buffer>) hash.update(chunk);
    return hash.digest('hex');
  }

  private async readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  private deterministicId(source: string): string {
    const value = createHash('sha256').update(source).digest('hex').slice(0, 32).split('');
    value[12] = '5';
    value[16] = ((Number.parseInt(value[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
    return `${value.slice(0, 8).join('')}-${value.slice(8, 12).join('')}-${value.slice(12, 16).join('')}-${value.slice(16, 20).join('')}-${value.slice(20).join('')}`;
  }

  private error(status: HttpStatus, messageKey: string, code: string): HttpException {
    return new AppHttpException(this.messages.translate(messageKey), status, { code });
  }
}
