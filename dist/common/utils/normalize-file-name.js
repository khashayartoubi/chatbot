"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFileName = normalizeFileName;
const MOJIBAKE_MARKS = /[ØÙ]/;
const PERSIAN_CHARACTERS = /[\u0600-\u06ff]/;
const UNSAFE_CHARACTERS = /[<>:"/\\|?*\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
function normalizeFileName(value) {
    let filename = value;
    if (MOJIBAKE_MARKS.test(filename)) {
        const decoded = Buffer.from(filename, 'latin1').toString('utf8');
        if (!decoded.includes('\uFFFD') && PERSIAN_CHARACTERS.test(decoded)) {
            filename = decoded;
        }
    }
    filename = filename
        .normalize('NFKC')
        .split('')
        .filter((character) => {
        const code = character.charCodeAt(0);
        return code > 31 && (code < 127 || code > 159);
    })
        .join('')
        .replace(/\u064a|\u0649/g, '\u06cc')
        .replace(/\u0643/g, '\u06a9')
        .replace(UNSAFE_CHARACTERS, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+|\.+$/g, '');
    const normalized = [...filename].slice(0, 240).join('');
    return normalized || 'file';
}
//# sourceMappingURL=normalize-file-name.js.map