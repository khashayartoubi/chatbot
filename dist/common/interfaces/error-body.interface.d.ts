export interface ErrorBody {
    message?: string | string[];
    error?: string;
    code?: string;
    details?: unknown[];
}
