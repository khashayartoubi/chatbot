"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerMessage = swaggerMessage;
require("dotenv/config");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const language = process.env['SWAGGER_LANGUAGE'] === 'en' ? 'en' : 'fa';
const translations = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '..', '..', 'i18n', language, 'messages.json'), 'utf8'));
function swaggerMessage(key) {
    let value = translations;
    for (const part of key.split('.')) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return key;
        }
        value = value[part];
    }
    return typeof value === 'string' ? value : key;
}
//# sourceMappingURL=swagger-message.js.map