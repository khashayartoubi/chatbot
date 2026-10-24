import { normalizeFileName } from './normalize-file-name';

describe('normalizeFileName', () => {
  it('repairs a Persian UTF-8 filename decoded as latin1', () => {
    const mojibake = Buffer.from('گزارش فارسی.pdf', 'utf8').toString('latin1');
    expect(normalizeFileName(mojibake)).toBe('گزارش فارسی.pdf');
  });

  it('normalizes Arabic variants and removes path separators', () => {
    expect(normalizeFileName('  فايل كاربری/نهایی.pdf  ')).toBe('فایل کاربری_نهایی.pdf');
  });
});
