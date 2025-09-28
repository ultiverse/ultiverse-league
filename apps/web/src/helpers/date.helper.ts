import dayjs, { Dayjs } from 'dayjs';

/**
 * Gets the next occurrence of a specific day of the week
 * @param dayOfWeek - Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns The next occurrence of the specified day
 */
export function getNextOccurrenceOfDay(dayOfWeek: number): Dayjs {
    const today = dayjs();
    const daysUntilTarget = (dayOfWeek - today.day() + 7) % 7;
    return daysUntilTarget === 0 ? today.add(7, 'day') : today.add(daysUntilTarget, 'day');
}