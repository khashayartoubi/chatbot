import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { ProjectsService } from '../projects/projects.service';
import type { UploadsService } from '../uploads/uploads.service';
import { FileManagerService } from './file-manager.service';

describe('FileManagerService', () => {
  it('loads paginated folder contents from the configured File Manager', async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: { data: [{ id: 'file-id' }] },
      })
    );
    const service = new FileManagerService(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => (key === 'DM_BASE_ASISSTANT_LANGUAGE_URL' ? 'http://file-manager/' : undefined)),
      } as unknown as ConfigService,
      {} as ProjectsService,
      {} as UploadsService,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.getRecent({ page: 2, limit: 25, folderId: 'folder/id' }, 'token')).resolves.toEqual([{ id: 'file-id' }]);
    expect(get).toHaveBeenCalledWith('http://file-manager/files-folders/list/folder%2Fid/contents', {
      headers: { Authorization: 'Bearer token' },
      params: { page: 2, limit: 25 },
    });
  });

  it('reports a missing File Manager configuration before making a request', async () => {
    const service = new FileManagerService(
      {} as HttpService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      {} as ProjectsService,
      {} as UploadsService,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.getStorage('token')).rejects.toMatchObject({
      status: 503,
      message: 'fileManager.notConfigured',
    });
  });

  it('forwards the status and message returned by File Manager', async () => {
    const get = jest.fn().mockReturnValue(
      throwError(() => ({
        isAxiosError: true,
        response: {
          status: 500,
          data: Buffer.from(
            JSON.stringify({
              error: {
                status: 422,
                message: 'شناسه پوشه معتبر نیست',
              },
            })
          ),
        },
      }))
    );
    const service = new FileManagerService(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => (key === 'DM_BASE_ASISSTANT_LANGUAGE_URL' ? 'http://file-manager' : undefined)),
      } as unknown as ConfigService,
      {} as ProjectsService,
      {} as UploadsService,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.getStorage('token')).rejects.toMatchObject({
      status: 422,
      message: 'شناسه پوشه معتبر نیست',
    });
  });

  it('uses the existing fallback when File Manager returns no message', async () => {
    const get = jest.fn().mockReturnValue(
      throwError(() => ({
        isAxiosError: true,
        response: { status: 500, data: {} },
      }))
    );
    const service = new FileManagerService(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => (key === 'DM_BASE_ASISSTANT_LANGUAGE_URL' ? 'http://file-manager' : undefined)),
      } as unknown as ConfigService,
      {} as ProjectsService,
      {} as UploadsService,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.getStorage('token')).rejects.toMatchObject({
      status: 502,
      message: 'fileManager.unavailable',
    });
  });
});
