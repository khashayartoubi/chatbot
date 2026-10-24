import { type ValidationOptions } from 'class-validator';
export declare function MaxLengthFromEnv(environmentVariable: string, defaultValue: number, validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
