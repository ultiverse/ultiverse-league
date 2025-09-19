"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUcTeamsParams = toUcTeamsParams;
function toUcTeamsParams(q) {
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
