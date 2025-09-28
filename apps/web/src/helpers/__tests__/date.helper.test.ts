import { getNextOccurrenceOfDay } from '../date.helper';
import dayjs from 'dayjs';
import { vi } from 'vitest';

describe('date.helper', () => {
    describe('getNextOccurrenceOfDay', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return next occurrence when target day is later in the week', () => {
            // Set current day to Monday (1)
            const monday = dayjs('2023-06-05'); // A Monday
            vi.setSystemTime(monday.toDate());

            // Get next Wednesday (3)
            const result = getNextOccurrenceOfDay(3);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-07'); // Wednesday
            expect(result.day()).toBe(3);
        });

        it('should return next occurrence when target day is earlier in the week', () => {
            // Set current day to Friday (5)
            const friday = dayjs('2023-06-09'); // A Friday
            vi.setSystemTime(friday.toDate());

            // Get next Wednesday (3)
            const result = getNextOccurrenceOfDay(3);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-14'); // Next Wednesday
            expect(result.day()).toBe(3);
        });

        it('should return next week when target day is today', () => {
            // Set current day to Wednesday (3)
            const wednesday = dayjs('2023-06-07'); // A Wednesday
            vi.setSystemTime(wednesday.toDate());

            // Get next Wednesday (3) - should be next week
            const result = getNextOccurrenceOfDay(3);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-14'); // Next Wednesday
            expect(result.day()).toBe(3);
            expect(result.diff(wednesday, 'day')).toBe(7);
        });

        it('should handle Sunday correctly (day 0)', () => {
            // Set current day to Thursday (4)
            const thursday = dayjs('2023-06-08'); // A Thursday
            vi.setSystemTime(thursday.toDate());

            // Get next Sunday (0)
            const result = getNextOccurrenceOfDay(0);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-11'); // Sunday
            expect(result.day()).toBe(0);
        });

        it('should handle Saturday correctly (day 6)', () => {
            // Set current day to Monday (1)
            const monday = dayjs('2023-06-05'); // A Monday
            vi.setSystemTime(monday.toDate());

            // Get next Saturday (6)
            const result = getNextOccurrenceOfDay(6);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-10'); // Saturday
            expect(result.day()).toBe(6);
        });

        it('should preserve time of day from current time', () => {
            // Set current time to Monday 3:30 PM
            const monday = dayjs('2023-06-05 15:30:00'); // Monday 3:30 PM
            vi.setSystemTime(monday.toDate());

            // Get next Wednesday
            const result = getNextOccurrenceOfDay(3);

            expect(result.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-06-07 15:30:00');
        });

        it('should handle edge case of Sunday to next Sunday', () => {
            // Set current day to Sunday (0)
            const sunday = dayjs('2023-06-04'); // A Sunday
            vi.setSystemTime(sunday.toDate());

            // Get next Sunday (0) - should be next week
            const result = getNextOccurrenceOfDay(0);

            expect(result.format('YYYY-MM-DD')).toBe('2023-06-11'); // Next Sunday
            expect(result.day()).toBe(0);
            expect(result.diff(sunday, 'day')).toBe(7);
        });
    });
});