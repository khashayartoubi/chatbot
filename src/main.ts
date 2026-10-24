import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import os from 'node:os';

import { AppModule } from './app.module';
import { LogManager } from './common/logger/log-manager.service';
import { swaggerMessage } from './common/i18n/swagger-message';
import { starter } from './common/starter';

function getMachineIp(): string | undefined {
  const interfaces = os.networkInterfaces();
  const addresses: Array<{ name: string; address: string }> = [];

  for (const [name, iface] of Object.entries(interfaces)) {
    if (!iface) continue;

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(LogManager));
  app.set('trust proxy', 1);
  app.enableCors({
    origin: '*',
  });
  app.setGlobalPrefix('chat/api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dana API')
    .setDescription(swaggerMessage('swagger.appDescription'))
    .setVersion('0.1.0')
    .addServer('/chat/api')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
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
              description: swaggerMessage('swagger.field.multipartPayload'),
              example:
                '{"collectionId":null,"historyId":null,"sessionId":"10894872377576","fileIds":[],"messageSchema":{"message":{"id":"19479117259861","type":"text","message":"sd","createdAt":"2026-07-28T12:35:41.935Z","attachments":[],"avatar":"","comment":"","liked":false,"disLiked":false,"starred":false,"bot":false,"unread":false,"delivered":true,"reply":[{"analyse":[],"data":[]}]}}}',
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

  SwaggerModule.setup('chat/api/docs', app, document, {
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
  starter(host, displayPort);
  // const PURPLE = '\x1b[35m';
  // const RESET = '\x1b[0m';

  // console.log(`${PURPLE}`);
  // console.log(' ----------------------------------------------------------------------------------------------------------------------------');
  // console.log('|                                                                                                                            |');
  // console.log('|                                                                                                                            |');
  // console.log('|                                                                                                                            |');
  // console.log('|        █████   ██████   █████   ██   ██ ██   ██  █████  ██████                     █████   ██████    █████   ██████        |');
  // console.log('|       ██   ██ ██       ██   ██  ██   ██ ██   ██ ██   ██ ██   ██                   ██   ██  ██   ██  ██   ██  ██   ██       |');
  // console.log('|       ███████ ██   ███ ███████  ███████  █████  ███████ ██████    ██████████      ███████  ██████   ███████  ██   ██       |');
  // console.log('|       ██   ██ ██    ██ ██   ██  ██   ██   ███   ██   ██ ██   ██                   ██   ██  ██   ██  ██   ██  ██   ██       |');
  // console.log('|       ██   ██  ██████  ██   ██  ██   ██    █    ██   ██ ██   ██                   ██   ██  ██   ██  ██   ██  ██████        |');
  // console.log('|                                                                                                                            |');
  // console.log('|                                                                                                                            |');
  // console.log('|                                                                                                                            |');
  // console.log(`|                                    Application is running on: http://${host}:${port}                                   |`);
  // console.log(`|                                    Swagger docs: http://${host}:${port}/chat/api/docs                                  |`);
  // console.log(' ----------------------------------------------------------------------------------------------------------------------------');
  // console.log(`${RESET}`);
  // console.log('');
}

void bootstrap();
