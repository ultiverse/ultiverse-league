import { Season, SEASON_COLORS } from '../constants';

/**
 * Get the season from a date string
 */
export function getSeason(dateStr?: string): Season {
    if (!dateStr) return 'Fall'; // Default to Fall if no date

    try {
        const date = new Date(dateStr);
        const month = date.getMonth(); // 0-11

        if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
        if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
        if (month >= 8 && month <= 10) return 'Fall'; // Sep, Oct, Nov
        return 'Winter'; // Dec, Jan, Feb
    } catch {
        return 'Fall'; // Default to Fall if parsing fails
    }
}

/**
 * Get the year from a date string
 */
export function getYear(dateStr?: string): number {
    if (!dateStr) return new Date().getFullYear();

    try {
        const date = new Date(dateStr);
        return date.getFullYear();
    } catch {
        return new Date().getFullYear();
    }
}

/**
 * Get the season color for Material-UI chip
 */
export function getSeasonColor(season: Season): 'primary' | 'secondary' | 'success' | 'warning' {
    return SEASON_COLORS[season];
}

/**
 * Format a season and year together
 */
export function formatSeasonYear(dateStr?: string): string {
    const season = getSeason(dateStr);
    const year = getYear(dateStr);
    return `${season} ${year}`;
}

/**
 * Format start date for display
 */
export function formatStartDate(dateStr?: string): string {
    if (!dateStr) return 'Date not available';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return 'Invalid date';
    }
}