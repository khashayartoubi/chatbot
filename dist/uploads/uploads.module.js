"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const project_entity_1 = require("../projects/entities/project.entity");
const queue_module_1 = require("../queue/queue.module");
const storage_module_1 = require("../storage/storage.module");
const project_files_controller_1 = require("./project-files.controller");
const upload_entity_1 = require("./entities/upload.entity");
const uploads_service_1 = require("./uploads.service");
const uploads_controller_1 = require("./uploads.controller");
const ai_uploads_controller_1 = require("./ai-uploads.controller");
let UploadsModule = class UploadsModule {
};
exports.UploadsModule = UploadsModule;
exports.UploadsModule = UploadsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([upload_entity_1.Upload, project_entity_1.Project]), auth_module_1.AuthModule, storage_module_1.StorageModule, queue_module_1.QueueModule],
        controllers: [uploads_controller_1.UploadsController, project_files_controller_1.ProjectFilesController, ai_uploads_controller_1.AiUploadsController],
        providers: [uploads_service_1.UploadsService],
        exports: [uploads_service_1.UploadsService],
    })
], UploadsModule);
//# sourceMappingURL=uploads.module.js.map