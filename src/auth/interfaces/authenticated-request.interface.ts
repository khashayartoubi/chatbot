import type { Request } from 'express';
import type { KeycloakUser } from './keycloak-user.interface';

export interface AuthenticatedRequest extends Request {
  userName: string;
  userInfo: KeycloakUser;
  token: string;
}
