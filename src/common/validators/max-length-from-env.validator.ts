import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

function getMaxLength(environmentVariable: string, defaultValue: number): number {
  const value = Number(process.env[environmentVariable]);
  return Number.isSafeInteger(value) && value > 0 ? value : defaultValue;
}

export function MaxLengthFromEnv(environmentVariable: string, defaultValue: number, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'maxLengthFromEnv',
      target: object.constructor,
      propertyName,
      constraints: [environmentVariable, defaultValue],
      options: validationOptions,
      validator: {
        validate(value: unknown, args?: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const [envName, fallback] = args!.constraints as [string, number];
          return value.length <= getMaxLength(envName, fallback);
        },
        defaultMessage(args?: ValidationArguments) {
          const [envName, fallback] = args!.constraints as [string, number];
          return `${args!.property} must be shorter than or equal to ${getMaxLength(envName, fallback)} characters`;
        },
      },
    });
  };
}
