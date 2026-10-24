"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userObjectName = userObjectName;
function userObjectName(username, ...segments) {
    const safeUsername = sanitizePathSegment(username);
    return [safeUsername, ...segments.map(sanitizePathSegment)].join('/');
}
function sanitizePathSegment(value) {
    return value.trim().replace(/[^\p{L}\p{N}._-]+/gu, '_') || '_';
}
//# sourceMappingURL=user-object-name.js.map