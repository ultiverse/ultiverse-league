/**
 * ICS (iCalendar) utility functions for exporting calendar events
 */

import { ICSEvent } from '../types/utils';

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeICSText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/;/g, '\\;')    // Escape semicolons
        .replace(/,/g, '\\,')    // Escape commas
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '');     // Remove carriage returns
}

/**
 * Folds ICS lines to 75 characters max (RFC 5545)
 */
function foldICSLine(line: string): string {
    if (line.length <= 75) {
        return line;
    }

    const folded = [];
    let start = 0;

    while (start < line.length) {
        if (start === 0) {
            // First line can be 75 characters
            folded.push(line.substring(start, Math.min(start + 75, line.length)));
            start += 75;
        } else {
            // Continuation lines start with space and can be 74 characters
            folded.push(' ' + line.substring(start, Math.min(start + 74, line.length)));
            start += 74;
        }
    }

    return folded.join('\n');
}

/**
 * Creates ICS calendar content from an array of events
 */
export function createICSContent(events: ICSEvent[], calendarName: string = 'Schedule'): string {
    const now = new Date();
    const timestamp = formatICSDate(now);

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Ultiverse//Schedule//EN',
        `X-WR-CALNAME:${escapeICSText(calendarName)}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    events.forEach(event => {
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${event.uid}`);
        lines.push(`DTSTAMP:${timestamp}`);
        lines.push(`DTSTART:${formatICSDate(event.start)}`);
        lines.push(`DTEND:${formatICSDate(event.end)}`);
        lines.push(`SUMMARY:${escapeICSText(event.title)}`);

        if (event.description) {
            lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
        }

        if (event.location) {
            lines.push(`LOCATION:${escapeICSText(event.location)}`);
        }

        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    // Fold long lines according to RFC 5545
    return lines.map(foldICSLine).join('\n');
}

/**
 * Downloads ICS content as a file
 */
export function downloadICS(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}

/**
 * Generates an ICS filename based on type and optional name
 */
export function generateICSFileName(type: string, name?: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (name) {
        const safeName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
        return `${safeName}_${type}_${dateStr}.ics`;
    }

    return `${type}_${dateStr}.ics`;
}