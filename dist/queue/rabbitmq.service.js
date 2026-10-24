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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RabbitMqService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMqService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = __importDefault(require("amqplib"));
const log_manager_service_1 = require("../common/logger/log-manager.service");
const infrastructure_unavailable_exception_1 = require("../error/exceptions/infrastructure-unavailable.exception");
let RabbitMqService = RabbitMqService_1 = class RabbitMqService {
    configService;
    logger;
    queueName = 'file.uploads';
    connection;
    channel;
    connecting;
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
    }
    async getChannel() {
        if (this.channel) {
            return this.channel;
        }
        this.connecting ??= this.connect().catch((error) => {
            this.connecting = undefined;
            throw new infrastructure_unavailable_exception_1.InfrastructureUnavailableException('RabbitMQ', 'RABBITMQ_UNAVAILABLE', error);
        });
        return this.connecting;
    }
    async publish(message) {
        try {
            const channel = await this.getChannel();
            channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
            await channel.waitForConfirms();
            this.logger.trace(RabbitMqService_1.name, 'Upload job published', {
                queue: this.queueName,
            });
        }
        catch (error) {
            this.channel = undefined;
            this.connecting = undefined;
            this.logger.failure(RabbitMqService_1.name, 'Could not publish upload job', error, {
                queue: this.queueName,
            });
            if (error instanceof infrastructure_unavailable_exception_1.InfrastructureUnavailableException) {
                throw error;
            }
            throw new infrastructure_unavailable_exception_1.InfrastructureUnavailableException('RabbitMQ', 'RABBITMQ_UNAVAILABLE', error);
        }
    }
    async onModuleDestroy() {
        await this.channel?.close();
        await this.connection?.close();
    }
    async connect() {
        const url = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
        this.logger.info(RabbitMqService_1.name, 'Connecting to RabbitMQ', {
            queue: this.queueName,
        });
        this.connection = await amqplib_1.default.connect(url);
        this.connection.on('close', () => {
            this.logger.warning(RabbitMqService_1.name, 'RabbitMQ connection closed', {
                queue: this.queueName,
            });
            this.connection = undefined;
            this.channel = undefined;
            this.connecting = undefined;
        });
        this.channel = await this.connection.createConfirmChannel();
        await this.channel.assertQueue(this.queueName, { durable: true });
        this.logger.info(RabbitMqService_1.name, 'RabbitMQ connection ready', {
            queue: this.queueName,
        });
        return this.channel;
    }
};
exports.RabbitMqService = RabbitMqService;
exports.RabbitMqService = RabbitMqService = RabbitMqService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        log_manager_service_1.LogManager])
], RabbitMqService);
//# sourceMappingURL=rabbitmq.service.js.map