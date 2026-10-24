"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const projects_module_1 = require("../projects/projects.module");
const uploads_module_1 = require("../uploads/uploads.module");
const file_manager_controller_1 = require("./file-manager.controller");
const file_manager_service_1 = require("./file-manager.service");
let FileManagerModule = class FileManagerModule {
};
exports.FileManagerModule = FileManagerModule;
exports.FileManagerModule = FileManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, auth_module_1.AuthModule, projects_module_1.ProjectsModule, uploads_module_1.UploadsModule],
        controllers: [file_manager_controller_1.FileManagerController],
        providers: [file_manager_service_1.FileManagerService],
        exports: [file_manager_service_1.FileManagerService],
    })
], FileManagerModule);
//# sourceMappingURL=file-manager.module.js.map