"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.starter = void 0;
const starter = (host, port) => {
    const PURPLE = '\x1b[35m';
    const RESET = '\x1b[0m';
    console.log(`${PURPLE}`);
    console.log(' -----------------------------------------------------------------------------------------------------------------------------------------------------');
    console.log('|                                                                                                                                                      |');
    console.log('|                                                                                                                                                      |');
    console.log('|                                                                                                                                                      |');
    console.log('|                   █████   ██████   █████   ██   ██ ██   ██  █████  ██████                        ██████   █████   ███   ██   █████                   |');
    console.log('|                  ██   ██ ██       ██   ██  ██   ██ ██   ██ ██   ██ ██   ██                       ██   ██ ██   ██  ████  ██  ██   ██                  |');
    console.log('|                  ███████ ██   ███ ███████  ███████  █████  ███████ ██████        ██████████      ██   ██ ███████  ██ ██ ██  ███████                  |');
    console.log('|                  ██   ██ ██    ██ ██   ██  ██   ██   ███   ██   ██ ██   ██                       ██   ██ ██   ██  ██  ████  ██   ██                  |');
    console.log('|                  ██   ██  ██████  ██   ██  ██   ██    █    ██   ██ ██   ██                       ██████  ██   ██  ██   ███  ██   ██                  |');
    console.log('|                                                                                                                                                      |');
    console.log('|                                                                                                                                                      |');
    console.log(`|                                                        Application is running on: http://${host}:${port}                                         |`);
    console.log(`|                                                        Swagger docs: http://${host}:${port}/chat/api/docs                                        |`);
    console.log('|                                                                                                                                                      |');
    console.log(' ------------------------------------------------------------------------------------------------------------------------------------------------------');
    console.log(`${RESET}`);
    console.log('');
};
exports.starter = starter;
//# sourceMappingURL=starter.js.map