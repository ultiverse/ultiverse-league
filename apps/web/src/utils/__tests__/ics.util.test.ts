import { createICSContent, generateICSFileName, ICSEvent } from '../ics.util';
import { vi } from 'vitest';

// Mock the download functionality
vi.mock('../ics.util', async () => {
    const actual = await vi.importActual('../ics.util');
    return {
        ...actual,
        downloadICS: vi.fn()
    };
});

describe('ics.util', () => {
    describe('createICSContent', () => {
        const mockEvents: ICSEvent[] = [
            {
                uid: 'test-1',
                title: 'Test Event 1',
                description: 'Test description',
                location: 'Test Location',
                start: new Date('2023-06-01T18:00:00Z'),
                end: new Date('2023-06-01T19:30:00Z')
            },
            {
                uid: 'test-2',
                title: 'Test Event 2',
                start: new Date('2023-06-02T18:00:00Z'),
                end: new Date('2023-06-02T19:30:00Z')
            }
        ];

        it('should create valid ICS content with calendar headers', () => {
            const result = createICSContent(mockEvents, 'Test Calendar');

            expect(result).toContain('BEGIN:VCALENDAR');
            expect(result).toContain('VERSION:2.0');
            expect(result).toContain('PRODID:-//Ultiverse//Schedule//EN');
            expect(result).toContain('X-WR-CALNAME:Test Calendar');
            expect(result).toContain('END:VCALENDAR');
        });

        it('should include all events with required fields', () => {
            const result = createICSContent(mockEvents);

            // Check for event blocks
            expect(result).toContain('BEGIN:VEVENT');
            expect(result).toContain('END:VEVENT');

            // Check for event 1 details
            expect(result).toContain('UID:test-1');
            expect(result).toContain('SUMMARY:Test Event 1');
            expect(result).toContain('DESCRIPTION:Test description');
            expect(result).toContain('LOCATION:Test Location');
            expect(result).toContain('DTSTART:20230601T180000Z');
            expect(result).toContain('DTEND:20230601T193000Z');

            // Check for event 2 details
            expect(result).toContain('UID:test-2');
            expect(result).toContain('SUMMARY:Test Event 2');
            expect(result).toContain('DTSTART:20230602T180000Z');
            expect(result).toContain('DTEND:20230602T193000Z');
        });

        it('should handle events without optional fields', () => {
            const minimalEvent: ICSEvent = {
                uid: 'minimal',
                title: 'Minimal Event',
                start: new Date('2023-06-01T18:00:00Z'),
                end: new Date('2023-06-01T19:00:00Z')
            };

            const result = createICSContent([minimalEvent]);

            expect(result).toContain('UID:minimal');
            expect(result).toContain('SUMMARY:Minimal Event');
            expect(result).not.toContain('DESCRIPTION:');
            expect(result).not.toContain('LOCATION:');
        });

        it('should escape special characters in text fields', () => {
            const eventWithSpecialChars: ICSEvent = {
                uid: 'special',
                title: 'Event; with, special\\chars\nand newlines',
                description: 'Description; with, special\\chars\nand newlines',
                location: 'Location; with, special\\chars',
                start: new Date('2023-06-01T18:00:00Z'),
                end: new Date('2023-06-01T19:00:00Z')
            };

            const result = createICSContent([eventWithSpecialChars]);

            expect(result).toContain('SUMMARY:Event\\; with\\, special\\\\chars\\nand newlines');
            expect(result).toContain('DESCRIPTION:Description\\; with\\, special\\\\chars\\nand newlines');
            expect(result).toContain('LOCATION:Location\\; with\\, special\\\\chars');
        });

        it('should handle empty events array', () => {
            const result = createICSContent([]);

            expect(result).toContain('BEGIN:VCALENDAR');
            expect(result).toContain('END:VCALENDAR');
            expect(result).not.toContain('BEGIN:VEVENT');
        });

        it('should use default calendar name when not provided', () => {
            const result = createICSContent(mockEvents);

            expect(result).toContain('X-WR-CALNAME:Schedule');
        });
    });

    describe('generateICSFileName', () => {
        beforeEach(() => {
            // Mock Date to return consistent values
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-06-01T12:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should generate filename with date', () => {
            const result = generateICSFileName('schedule');

            expect(result).toBe('schedule_2023-06-01.ics');
        });

        it('should generate filename with name and date', () => {
            const result = generateICSFileName('schedule', 'Test League');

            expect(result).toBe('Test_League_schedule_2023-06-01.ics');
        });

        it('should sanitize special characters in name', () => {
            const result = generateICSFileName('schedule', 'League/Name with spaces & symbols!');

            expect(result).toBe('League_Name_with_spaces___symbols__schedule_2023-06-01.ics');
        });

        it('should handle empty name', () => {
            const result = generateICSFileName('schedule', '');

            expect(result).toBe('schedule_2023-06-01.ics');
        });
    });
});