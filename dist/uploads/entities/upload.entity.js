"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upload = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../projects/entities/project.entity");
const upload_status_enum_1 = require("../enums/upload-status.enum");
const file_state_enum_1 = require("../enums/file-state.enum");
const file_tag_enum_1 = require("../../storage/enums/file-tag.enum");
let Upload = class Upload {
    uploadId;
    fileId;
    username;
    filename;
    projectId;
    project;
    sessionId;
    historyId;
    originalName;
    mimeType;
    size;
    status;
    objectName;
    bucket;
    tag;
    sourceFileId;
    sourceFile;
    generatedFiles;
    fullPath;
    state;
    error;
    createdAt;
    uploadedAt;
    updatedAt;
};
exports.Upload = Upload;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Upload.prototype, "uploadId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Upload.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Upload.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Upload.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.uploads, {
        nullable: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({
        name: 'projectId',
        foreignKeyConstraintName: 'FK_uploads_project',
    }),
    __metadata("design:type", Object)
], Upload.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "historyId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Upload.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Upload.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], Upload.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: upload_status_enum_1.UploadStatus, default: upload_status_enum_1.UploadStatus.QUEUED }),
    __metadata("design:type", String)
], Upload.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "objectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'dana-client' }),
    __metadata("design:type", String)
], Upload.prototype, "bucket", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: file_tag_enum_1.FileTag.USER }),
    __metadata("design:type", String)
], Upload.prototype, "tag", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "sourceFileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Upload, (upload) => upload.generatedFiles, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({
        name: 'sourceFileId',
        referencedColumnName: 'fileId',
        foreignKeyConstraintName: 'FK_uploads_source_file',
    }),
    __metadata("design:type", Object)
], Upload.prototype, "sourceFile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Upload, (upload) => upload.sourceFile),
    __metadata("design:type", Object)
], Upload.prototype, "generatedFiles", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "fullPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: file_state_enum_1.FileState, default: file_state_enum_1.FileState.PENDING }),
    __metadata("design:type", String)
], Upload.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Upload.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Upload.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Upload.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Upload.prototype, "updatedAt", void 0);
exports.Upload = Upload = __decorate([
    (0, typeorm_1.Entity)('uploads'),
    (0, typeorm_1.Index)('IDX_uploads_fileId', ['fileId'], { unique: true }),
    (0, typeorm_1.Index)('IDX_uploads_general_history', ['username', 'historyId']),
    (0, typeorm_1.Index)('IDX_uploads_projectId', ['projectId']),
    (0, typeorm_1.Index)('IDX_uploads_sourceFileId', ['sourceFileId'])
], Upload);
//# sourceMappingURL=upload.entity.js.map