"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UC_START_KEYWORDS = exports.UC_GENDER = exports.UC_EVENT_STATUS = exports.UC_EVENT_ORDER_BY = exports.UC_EVENT_TYPES = void 0;
exports.toUCDateString = toUCDateString;
exports.parseCsvEnum = parseCsvEnum;
exports.parseOptionalInt = parseOptionalInt;
exports.parseStart = parseStart;
exports.UC_EVENT_TYPES = [
    'administrative',
    'camp',
    'day camp',
    'class',
    'clinic',
    'coaching',
    'competition',
    'hat tournament',
    'function',
    'league',
    'meet',
    'other',
    'pickup',
    'race',
    'season',
    'tournament',
    'training',
    'tryout',
    'practice',
];
exports.UC_EVENT_ORDER_BY = [
    'date_desc',
    'date_asc',
    'name_asc',
    'start_date_asc',
];
exports.UC_EVENT_STATUS = ['registering', 'happening'];
exports.UC_GENDER = ['men', 'mixed', 'open', 'women'];
exports.UC_START_KEYWORDS = [
    'all',
    'current',
    'future',
    'ongoing',
];
// Type guard to brand a date-ish string
function toUCDateString(value) {
    return value;
}
function parseCsvEnum(csv, allowed) {
    const set = new Set(allowed);
    return csv
        .split(',')
        .map((s) => s.trim())
        .filter((s) => set.has(s));
}
function parseOptionalInt(v) {
    if (v == null)
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
function parseStart(value) {
    if (!value)
        return undefined;
    const lower = value.toLowerCase();
    if (exports.UC_START_KEYWORDS.includes(lower)) {
        return lower;
    }
    // Accept raw date strings; brand them so the union isn't plain `string`.
    // If you want validation, add a regex like: /^\d{4}-\d{2}-\d{2}(\b|T)/
    return toUCDateString(value);
}
