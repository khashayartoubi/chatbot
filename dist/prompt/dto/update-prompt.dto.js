"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePromptDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_prompt_dto_1 = require("./create-prompt.dto");
class UpdatePromptDto extends (0, swagger_1.PartialType)(create_prompt_dto_1.CreatePromptDto) {
}
exports.UpdatePromptDto = UpdatePromptDto;
//# sourceMappingURL=update-prompt.dto.js.map