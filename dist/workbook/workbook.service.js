"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkbookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const typeorm_2 = require("typeorm");
const XLSX = __importStar(require("xlsx"));
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const normalize_file_name_1 = require("../common/utils/normalize-file-name");
const dana_service_1 = require("../dana/dana.service");
const app_http_exception_1 = require("../error/exceptions/app-http.exception");
const infrastructure_unavailable_exception_1 = require("../error/exceptions/infrastructure-unavailable.exception");
const file_tag_enum_1 = require("../storage/enums/file-tag.enum");
const minio_service_1 = require("../storage/minio.service");
const user_object_name_1 = require("../storage/utils/user-object-name");
const upload_entity_1 = require("../uploads/entities/upload.entity");
const selection_mode_enum_1 = require("../stream/enums/selection-mode.enum");
const workbook_file_constants_1 = require("./constants/workbook-file.constants");
const workbook_analysis_entity_1 = require("./entities/workbook-analysis.entity");
const workbook_row_entity_1 = require("./entities/workbook-row.entity");
const workbook_sheet_entity_1 = require("./entities/workbook-sheet.entity");
const workbook_entity_1 = require("./entities/workbook.entity");
let WorkbookService = WorkbookService_1 = class WorkbookService {
    workbooksRepository;
    sheetsRepository;
    rowsRepository;
    analysesRepository;
    minioService;
    danaService;
    configService;
    messages;
    logger;
    constructor(workbooksRepository, sheetsRepository, rowsRepository, analysesRepository, minioService, danaService, configService, messages, logger) {
        this.workbooksRepository = workbooksRepository;
        this.sheetsRepository = sheetsRepository;
        this.rowsRepository = rowsRepository;
        this.analysesRepository = analysesRepository;
        this.minioService = minioService;
        this.danaService = danaService;
        this.configService = configService;
        this.messages = messages;
        this.logger = logger;
    }
    async create(file, username, organizationId) {
        const extension = file.originalname.split('.').at(-1)?.toLowerCase() ?? '';
        try {
            await this.validateFile(file, extension);
            const workbookId = (0, node_crypto_1.randomUUID)();
            const versionId = (0, node_crypto_1.randomUUID)();
            const originalName = (0, normalize_file_name_1.normalizeFileName)(file.originalname);
            const bucket = this.configService.get('MINIO_BUCKET', 'dana-client');
            const objectKey = (0, user_object_name_1.userObjectName)('excel-assistant', organizationId, workbookId, `v1.${extension}`);
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
                await this.minioService.upload(file.path, objectKey, workbook.mimeType, bucket, file_tag_enum_1.FileTag.USER);
                await this.workbooksRepository.save(workbook);
            }
            catch (error) {
                await this.minioService.remove(objectKey, bucket).catch(() => undefined);
                if (error instanceof infrastructure_unavailable_exception_1.InfrastructureUnavailableException) {
                    throw error;
                }
                throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.storeFailed', 'WORKBOOK_STORE_FAILED');
            }
            void this.parseWorkbook(workbook);
            return { workbookId, versionId, jobId: `parse-${workbookId}`, status: 'queued' };
        }
        finally {
            await (0, promises_1.unlink)(file.path).catch(() => undefined);
        }
    }
    async findOne(workbookId, username, organizationId) {
        return { workbook: this.workbookMetadata(await this.findOwnedWorkbook(workbookId, username, organizationId)) };
    }
    async getSheets(workbookId, username, organizationId) {
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
        }
        catch {
            throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.sheetsReadFailed', 'SHEETS_READ_FAILED');
        }
    }
    async getRows(sheetId, username, organizationId, offset, limit) {
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
        }
        catch {
            throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.rowsReadFailed', 'SHEET_ROWS_READ_FAILED');
        }
    }
    async createAnalysis(workbookId, dto, username, organizationId, idempotencyKey) {
        const workbook = await this.findOwnedWorkbook(workbookId, username, organizationId);
        if (workbook.status !== 'ready') {
            throw this.error(common_1.HttpStatus.CONFLICT, 'workbook.notReady', 'WORKBOOK_NOT_READY');
        }
        if (workbook.versionId !== dto.versionId) {
            throw this.error(common_1.HttpStatus.CONFLICT, 'workbook.versionMismatch', 'VERSION_MISMATCH');
        }
        if (!dto.question.trim()) {
            throw this.error(common_1.HttpStatus.BAD_REQUEST, 'workbook.questionRequired', 'INVALID_QUESTION');
        }
        if (!this.validSelectedCells(dto.selectedCells)) {
            throw this.error(common_1.HttpStatus.BAD_REQUEST, 'workbook.invalidCellRange', 'INVALID_CELL_RANGE');
        }
        if (idempotencyKey) {
            const previous = await this.analysesRepository.findOneBy({ workbookId, username, idempotencyKey });
            if (previous)
                return { analysisId: previous.analysisId, status: previous.status };
        }
        const analysis = await this.analysesRepository.save(this.analysesRepository.create({
            analysisId: (0, node_crypto_1.randomUUID)(),
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
        }));
        void this.runAnalysis(analysis, workbook);
        return { analysisId: analysis.analysisId, status: 'queued' };
    }
    async getAnalysis(analysisId, username, organizationId) {
        let analysis;
        try {
            analysis = await this.analysesRepository.findOneBy({ analysisId });
        }
        catch {
            throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.analysisReadFailed', 'ANALYSIS_READ_FAILED');
        }
        if (!analysis)
            throw this.error(common_1.HttpStatus.NOT_FOUND, 'workbook.analysisNotFound', 'ANALYSIS_NOT_FOUND');
        if (analysis.username !== username || analysis.organizationId !== organizationId) {
            throw this.error(common_1.HttpStatus.FORBIDDEN, 'workbook.analysisForbidden', 'ANALYSIS_FORBIDDEN');
        }
        return {
            analysisId: analysis.analysisId,
            status: analysis.status,
            ...(analysis.result ? { result: analysis.result } : {}),
            ...(analysis.error ? { error: analysis.error } : {}),
        };
    }
    async parseWorkbook(workbook) {
        try {
            this.logger.info(WorkbookService_1.name, this.messages.translate('workbook.parseStarted'), { workbookId: workbook.workbookId });
            workbook.status = 'processing';
            await this.workbooksRepository.save(workbook);
            const object = await this.minioService.preview(workbook.objectKey, workbook.bucket);
            const buffer = await this.readStream(object.stream);
            const parsed = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellFormula: true });
            const sheets = [];
            const rows = [];
            parsed.SheetNames.forEach((sheetName, sheetIndex) => {
                const worksheet = parsed.Sheets[sheetName];
                if (!worksheet)
                    return;
                const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:A1');
                const columnCount = range.e.c + 1;
                const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null, blankrows: true });
                const headers = this.uniqueHeaders(matrix[0] ?? [], columnCount);
                const sheetId = this.deterministicId(`${workbook.workbookId}:${workbook.versionId}:${sheetIndex}`);
                const rowCount = Math.max(range.e.r, 0);
                sheets.push(this.sheetsRepository.create({
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
                }));
                for (let index = 0; index < rowCount; index++) {
                    const values = matrix[index + 1] ?? [];
                    rows.push(this.rowsRepository.create({
                        sheetId,
                        rowNumber: index + 2,
                        values: Object.fromEntries(headers.map((header, columnIndex) => [header, this.jsonValue(values[columnIndex])])),
                    }));
                }
            });
            await this.sheetsRepository.save(sheets);
            for (let index = 0; index < rows.length; index += 500) {
                await this.rowsRepository.save(rows.slice(index, index + 500));
            }
            workbook.status = 'ready';
            workbook.lastError = null;
            await this.workbooksRepository.save(workbook);
            this.logger.info(WorkbookService_1.name, this.messages.translate('workbook.parseCompleted'), { workbookId: workbook.workbookId });
        }
        catch (error) {
            workbook.status = 'failed';
            workbook.lastError = error instanceof Error ? error.message : this.messages.translate('workbook.parseFailed');
            await this.workbooksRepository.save(workbook).catch(() => undefined);
            this.logger.failure(WorkbookService_1.name, this.messages.translate('workbook.parseFailed'), error, { workbookId: workbook.workbookId });
        }
    }
    async runAnalysis(analysis, workbook) {
        try {
            analysis.status = 'processing';
            await this.analysesRepository.save(analysis);
            const file = Object.assign(new upload_entity_1.Upload(), {
                username: workbook.username,
                filename: workbook.originalName,
                originalName: workbook.originalName,
                mimeType: workbook.mimeType,
                size: Number(workbook.size),
                bucket: workbook.bucket,
                objectName: workbook.objectKey,
            });
            const prompt = `${analysis.question}\n${this.messages.translate('workbook.selectedCells')}: ${analysis.selectedCells || this.messages.translate('workbook.allData')}\n${this.messages.translate('workbook.chart')}: ${this.messages.translate(analysis.chartRequested ? 'workbook.yes' : 'workbook.no')}`;
            const answer = await this.danaService.stream({
                userQuery: prompt,
                username: analysis.username,
                history: [],
                historyCount: 0,
                selectionMode: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
                files: [file],
            }, () => undefined);
            analysis.status = 'completed';
            analysis.result = { answer, changes: [] };
            await this.analysesRepository.save(analysis);
        }
        catch (error) {
            analysis.status = 'failed';
            analysis.error = error instanceof Error ? error.message : this.messages.translate('workbook.analysisFailed');
            await this.analysesRepository.save(analysis).catch(() => undefined);
            this.logger.failure(WorkbookService_1.name, this.messages.translate('workbook.analysisFailed'), error, { analysisId: analysis.analysisId });
        }
    }
    async findOwnedWorkbook(workbookId, username, organizationId) {
        let workbook;
        try {
            workbook = await this.workbooksRepository.findOneBy({ workbookId });
        }
        catch {
            throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.readFailed', 'WORKBOOK_READ_FAILED');
        }
        if (!workbook)
            throw this.error(common_1.HttpStatus.NOT_FOUND, 'workbook.notFound', 'WORKBOOK_NOT_FOUND');
        if (workbook.username !== username || workbook.organizationId !== organizationId) {
            throw this.error(common_1.HttpStatus.FORBIDDEN, 'workbook.forbidden', 'WORKBOOK_FORBIDDEN');
        }
        return workbook;
    }
    async findOwnedSheet(sheetId, username) {
        let sheet;
        try {
            sheet = await this.sheetsRepository.findOneBy({ sheetId });
        }
        catch {
            throw this.error(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'workbook.sheetReadFailed', 'SHEET_READ_FAILED');
        }
        if (!sheet)
            throw this.error(common_1.HttpStatus.NOT_FOUND, 'workbook.sheetNotFound', 'SHEET_NOT_FOUND');
        if (sheet.username !== username)
            throw this.error(common_1.HttpStatus.FORBIDDEN, 'workbook.sheetForbidden', 'SHEET_FORBIDDEN');
        return sheet;
    }
    workbookMetadata(workbook) {
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
    databaseNumber(value) {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    }
    uniqueHeaders(values, columnCount) {
        const used = new Map();
        return Array.from({ length: columnCount }, (_, index) => {
            const value = values[index];
            const base = (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value).trim() : '') ||
                `${this.messages.translate('workbook.column')} ${index + 1}`;
            const count = (used.get(base) ?? 0) + 1;
            used.set(base, count);
            return count === 1 ? base : `${base} (${count})`;
        });
    }
    jsonValue(value) {
        if (value === undefined || value === null)
            return null;
        if (value instanceof Date)
            return value.toISOString();
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
            return value;
        return JSON.parse(JSON.stringify(value));
    }
    validSelectedCells(value) {
        return !value.trim() || /^(?:[A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)(?:,\s*[A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)*$/i.test(value.trim());
    }
    async validateFile(file, extension) {
        if (!workbook_file_constants_1.WORKBOOK_FILE_EXTENSIONS.has(extension) || !workbook_file_constants_1.WORKBOOK_FILE_MIME_TYPES.has(file.mimetype)) {
            throw this.error(common_1.HttpStatus.BAD_REQUEST, 'workbook.invalidFileType', 'INVALID_FILE_TYPE');
        }
        const maxSize = this.configService.get('UPLOAD_MAX_FILE_SIZE', 100 * 1024 * 1024);
        if (file.size > maxSize)
            throw this.error(common_1.HttpStatus.PAYLOAD_TOO_LARGE, 'workbook.fileTooLarge', 'FILE_TOO_LARGE');
        const handle = await (0, promises_1.open)(file.path, 'r');
        const signature = Buffer.alloc(8);
        try {
            await handle.read(signature, 0, signature.length, 0);
        }
        finally {
            await handle.close();
        }
        const xlsxValid = extension !== 'xlsx' || signature.subarray(0, 2).toString() === 'PK';
        const xlsValid = extension !== 'xls' || signature.toString('hex').startsWith('d0cf11e0a1b11ae1');
        if (!xlsxValid || !xlsValid)
            throw this.error(common_1.HttpStatus.BAD_REQUEST, 'workbook.invalidFileSignature', 'INVALID_FILE_SIGNATURE');
    }
    async sha256(path) {
        const hash = (0, node_crypto_1.createHash)('sha256');
        for await (const chunk of (0, node_fs_1.createReadStream)(path))
            hash.update(chunk);
        return hash.digest('hex');
    }
    async readStream(stream) {
        const chunks = [];
        for await (const chunk of stream)
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return Buffer.concat(chunks);
    }
    deterministicId(source) {
        const value = (0, node_crypto_1.createHash)('sha256').update(source).digest('hex').slice(0, 32).split('');
        value[12] = '5';
        value[16] = ((Number.parseInt(value[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
        return `${value.slice(0, 8).join('')}-${value.slice(8, 12).join('')}-${value.slice(12, 16).join('')}-${value.slice(16, 20).join('')}-${value.slice(20).join('')}`;
    }
    error(status, messageKey, code) {
        return new app_http_exception_1.AppHttpException(this.messages.translate(messageKey), status, { code });
    }
};
exports.WorkbookService = WorkbookService;
exports.WorkbookService = WorkbookService = WorkbookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workbook_entity_1.Workbook)),
    __param(1, (0, typeorm_1.InjectRepository)(workbook_sheet_entity_1.WorkbookSheetEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(workbook_row_entity_1.WorkbookRow)),
    __param(3, (0, typeorm_1.InjectRepository)(workbook_analysis_entity_1.WorkbookAnalysis)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        minio_service_1.MinioService,
        dana_service_1.DanaService,
        config_1.ConfigService,
        i18n_message_service_1.I18nMessageService,
        log_manager_service_1.LogManager])
], WorkbookService);
//# sourceMappingURL=workbook.service.js.map