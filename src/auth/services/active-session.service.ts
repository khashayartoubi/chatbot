import { Injectable } from '@nestjs/common';
import type { ActiveSession } from '../interfaces/active-session.interface';

@Injectable()
export class ActiveSessionService {
  private readonly sessions = new Map<string, ActiveSession>();

  get(username: string): ActiveSession | undefined {
    return this.sessions.get(username);
  }

  register(username: string, token: string, ip?: string): void {
    this.sessions.set(username, { token, ip });
  }

  remove(username: string): void {
    this.sessions.delete(username);
  }
}
