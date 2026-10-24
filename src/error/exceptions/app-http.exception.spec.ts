import { HttpStatus } from '@nestjs/common';
import { AppHttpException } from './app-http.exception';

describe('AppHttpException', () => {
  it('returns the standard application error response', () => {
    const exception = new AppHttpException('درخواست نامعتبر است', HttpStatus.BAD_REQUEST);

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      success: false,
      status: HttpStatus.BAD_REQUEST,
      message: 'درخواست نامعتبر است',
      data: [],
    });
  });

  it('does not expose internal application error codes', () => {
    const exception = new AppHttpException('Workbook پیدا نشد.', HttpStatus.NOT_FOUND, {
      code: 'WORKBOOK_NOT_FOUND',
    });

    expect(exception.getResponse()).toEqual({
      success: false,
      status: HttpStatus.NOT_FOUND,
      message: 'Workbook پیدا نشد.',
      data: [],
    });
  });
});
