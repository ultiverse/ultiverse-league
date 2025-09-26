/**
 * Field and venue related utility functions
 */

/**
 * Format field name with venue and field slot information
 */
export function formatFieldName(venue?: string, field?: string | null, fieldSlots?: string[]): string {
    // If we have field slots defined and a specific field, use venue + field
    if (venue && field && fieldSlots && fieldSlots.length > 0) {
        return `${venue} - ${field}`;
    }

    // If we have field slots but no specific field assigned, use the first available slot
    if (venue && fieldSlots && fieldSlots.length > 0) {
        return `${venue} - ${fieldSlots[0] || 'Main Field'}`;
    }

    // Fallback to original logic
    if (venue && field) {
        return `${venue} - ${field}`;
    }
    if (venue) {
        return `${venue} - Main Field`;
    }
    if (field) {
        return field;
    }
    return 'Main Field';
}