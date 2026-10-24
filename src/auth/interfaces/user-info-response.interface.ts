import type { KeycloakUser } from './keycloak-user.interface';

export interface UserInfoResponse {
  data?: KeycloakUser | { data?: KeycloakUser };
  profile?: KeycloakUser;
}
