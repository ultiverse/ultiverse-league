"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUcEventsParams = toUcEventsParams;
function toUcEventsParams(q) {
    if (!q)
        return undefined;
    const out = {};
    for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === null)
            continue;
        if (Array.isArray(v)) {
            if (v.length === 0)
                continue;
            // Arrays are serialized as CSV per UC help
            out[k] = v.join(',');
            continue;
        }
        // Narrow to only the primitives the endpoint accepts
        if (typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean') {
            out[k] = v;
            continue;
        }
        // If other types ever slip through, ignore them rather than sending junk
        // NOTE: This branch should be unreachable due to EventsQuery typing.
    }
    return Object.keys(out).length ? out : undefined;
}
