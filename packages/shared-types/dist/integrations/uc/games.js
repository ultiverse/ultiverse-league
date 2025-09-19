"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UC_GAME_STATUS = void 0;
exports.toUcGamesParams = toUcGamesParams;
exports.UC_GAME_STATUS = [
    'teams_not_set',
    'scheduled',
    'has_outcome',
    'in_progress',
];
function toUcGamesParams(q) {
    if (!q)
        return undefined;
    const out = {};
    for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === null)
            continue;
        if (Array.isArray(v)) {
            if (!v.length)
                continue;
            out[k] = v.join(',');
        }
        else if (typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean') {
            out[k] = v;
        }
    }
    return Object.keys(out).length ? out : undefined;
}
