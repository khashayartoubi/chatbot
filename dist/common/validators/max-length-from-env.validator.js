"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxLengthFromEnv = MaxLengthFromEnv;
const class_validator_1 = require("class-validator");
function getMaxLength(environmentVariable, defaultValue) {
    const value = Number(process.env[environmentVariable]);
    return Number.isSafeInteger(value) && value > 0 ? value : defaultValue;
}
function MaxLengthFromEnv(environmentVariable, defaultValue, validationOptions) {
    return (object, propertyName) => {
        (0, class_validator_1.registerDecorator)({
            name: 'maxLengthFromEnv',
            target: object.constructor,
            propertyName,
            constraints: [environmentVariable, defaultValue],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    if (typeof value !== 'string')
                        return false;
                    const [envName, fallback] = args.constraints;
                    return value.length <= getMaxLength(envName, fallback);
                },
                defaultMessage(args) {
                    const [envName, fallback] = args.constraints;
                    return `${args.property} must be shorter than or equal to ${getMaxLength(envName, fallback)} characters`;
                },
            },
        });
    };
}
//# sourceMappingURL=max-length-from-env.validator.js.map