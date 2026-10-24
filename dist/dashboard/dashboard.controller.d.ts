import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class DashboardController {
    getProfile(request: AuthenticatedRequest): {
        success: boolean;
        profile: import("../auth/interfaces/keycloak-user.interface").KeycloakUser;
    };
}
