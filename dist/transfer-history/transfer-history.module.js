"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const projects_module_1 = require("../projects/projects.module");
const socket_module_1 = require("../socket/socket.module");
const stream_module_1 = require("../stream/stream.module");
const transfer_history_controller_1 = require("./transfer-history.controller");
const transfer_history_service_1 = require("./transfer-history.service");
let TransferHistoryModule = class TransferHistoryModule {
};
exports.TransferHistoryModule = TransferHistoryModule;
exports.TransferHistoryModule = TransferHistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, projects_module_1.ProjectsModule, stream_module_1.StreamModule, socket_module_1.SocketModule],
        controllers: [transfer_history_controller_1.TransferHistoryController],
        providers: [transfer_history_service_1.TransferHistoryService],
    })
], TransferHistoryModule);
//# sourceMappingURL=transfer-history.module.js.map