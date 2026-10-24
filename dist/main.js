"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const node_os_1 = __importDefault(require("node:os"));
const app_module_1 = require("./app.module");
const log_manager_service_1 = require("./common/logger/log-manager.service");
const swagger_message_1 = require("./common/i18n/swagger-message");
const starter_1 = require("./common/starter");
function getMachineIp() {
    const interfaces = node_os_1.default.networkInterfaces();
    const addresses = [];
    for (const [name, iface] of Object.entries(interfaces)) {
        if (!iface)
            continue;
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                addresses.push({ name, address: addr.address });
            }
        }
    }
    const physicalAddress = addresses.find(({ name }) => !/^(br-|docker|veth|virbr|vmnet|tun|tap|tailscale)/i.test(name));
    return physicalAddress?.address ?? addresses[0]?.address;
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(log_manager_service_1.LogManager));
    app.set('trust proxy', 1);
    app.enableCors({
        origin: '*',
    });
    app.setGlobalPrefix('chat/api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Dana API')
        .setDescription((0, swagger_message_1.swaggerMessage)('swagger.appDescription'))
        .setVersion('0.1.0')
        .addServer('/chat/api')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    }, 'bearerAuth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig, {
        ignoreGlobalPrefix: true,
    });
    const streamOperation = document.paths['/ai-chat-assistant']?.post;
    if (streamOperation?.requestBody && !('$ref' in streamOperation.requestBody)) {
        streamOperation.requestBody.content = {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/StreamMessageDto',
                },
            },
            'multipart/form-data': {
                schema: {
                    type: 'object',
                    required: ['payload'],
                    properties: {
                        payload: {
                            type: 'string',
                            description: (0, swagger_message_1.swaggerMessage)('swagger.field.multipartPayload'),
                            example: '{"collectionId":null,"historyId":null,"sessionId":"10894872377576","fileIds":[],"messageSchema":{"message":{"id":"19479117259861","type":"text","message":"sd","createdAt":"2026-07-28T12:35:41.935Z","attachments":[],"avatar":"","comment":"","liked":false,"disLiked":false,"starred":false,"bot":false,"unread":false,"delivered":true,"reply":[{"analyse":[],"data":[]}]}}}',
                        },
                        files: {
                            type: 'array',
                            items: {
                                type: 'string',
                                format: 'binary',
                            },
                        },
                    },
                },
            },
        };
    }
    swagger_1.SwaggerModule.setup('chat/api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'DANA API',
    });
    const port = Number(process.env['PORT']) || 5800;
    await app.listen(port);
    const host = process.env['HOST_IP']?.trim() || getMachineIp();
    if (!host) {
        throw new Error('Could not detect the machine IPv4 address and HOST_IP is not configured');
    }
    const displayPort = Number(process.env['DANA_PORT']) || port;
    console.log('');
    (0, starter_1.starter)(host, displayPort);
}
void bootstrap();
//# sourceMappingURL=main.js.map