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
var LogManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
const common_1 = require("@nestjs/common");
let LogManager = LogManager_1 = class LogManager extends common_1.ConsoleLogger {
    environment = LogManager_1.environment();
    centralizedUrl = process.env['CENTRAL_LOG_URL'];
    constructor() {
        super('DanaBackend', {
            logLevels: LogManager_1.getLogLevels(),
            timestamp: true,
        });
    }
    info(context, message, metadata) {
        this.log(this.format(message, metadata), context);
    }
    trace(context, message, metadata) {
        this.debug(this.format(message, metadata), context);
    }
    warning(context, message, metadata) {
        this.warn(this.format(message, metadata), context);
    }
    failure(context, message, error, metadata) {
        this.error(this.format(message, metadata), error instanceof Error ? error.stack : undefined, context);
    }
    log(message, context) {
        this.write('info', message, context);
    }
    debug(message, context) {
        this.write('debug', message, context);
    }
    warn(message, context) {
        this.write('warn', message, context);
    }
    error(message, stack, context) {
        this.write('error', message, context, stack);
    }
    static getLogLevels() {
        return this.environment() === 'development' ? ['debug', 'log', 'warn', 'error'] : ['log', 'warn', 'error'];
    }
    static environment() {
        const value = process.env['NODE_ENV'];
        return value === 'staging' || value === 'production' ? value : 'development';
    }
    write(level, message, context, stack) {
        if (this.environment !== 'production') {
            this.writeToConsole(level, message, context, stack);
        }
        if (this.environment !== 'development' && this.centralizedUrl) {
            void fetch(this.centralizedUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ level, message: String(message), context, stack, timestamp: new Date().toISOString() }),
            }).catch(() => undefined);
        }
    }
    writeToConsole(level, message, context, stack) {
        if (level === 'debug') {
            super.debug(message, context);
            return;
        }
        if (level === 'warn') {
            super.warn(message, context);
            return;
        }
        if (level === 'error') {
            super.error(message, stack, context);
            return;
        }
        super.log(message, context);
    }
    format(message, metadata) {
        if (!metadata) {
            return message;
        }
        const values = Object.entries(metadata).filter((entry) => entry[1] !== undefined);
        return values.length ? `${message} | ${values.map(([key, value]) => `${key}=${String(value)}`).join(' ')}` : message;
    }
};
exports.LogManager = LogManager;
exports.LogManager = LogManager = LogManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LogManager);
//# sourceMappingURL=log-manager.service.js.map