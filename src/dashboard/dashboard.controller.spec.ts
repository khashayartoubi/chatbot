import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
    })
      .overrideGuard(KeycloakAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DashboardController);
  });

  it('returns the current user profile', () => {
    const userInfo = { username: 'test-user' };
    const request = { userInfo } as AuthenticatedRequest;

    expect(controller.getProfile(request)).toEqual({
      success: true,
      profile: userInfo,
    });
  });
});
