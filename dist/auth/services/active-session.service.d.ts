import type { ActiveSession } from '../interfaces/active-session.interface';
export declare class ActiveSessionService {
    private readonly sessions;
    get(username: string): ActiveSession | undefined;
    register(username: string, token: string, ip?: string): void;
    remove(username: string): void;
}
