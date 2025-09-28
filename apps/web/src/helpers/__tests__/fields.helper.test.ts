import { formatFieldName } from '../fields.helper';

describe('fields.helper', () => {
    describe('formatFieldName', () => {
        it('should format venue + field + fieldSlots', () => {
            const venue = 'Bowring Park';
            const field = 'Field A';
            const fieldSlots = ['Field A', 'Field B'];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Field A');
        });

        it('should use first fieldSlot when no specific field', () => {
            const venue = 'Bowring Park';
            const field = null;
            const fieldSlots = ['Field A', 'Field B'];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Field A');
        });

        it('should fallback to Main Field with venue but no fieldSlots', () => {
            const venue = 'Bowring Park';
            const field = null;
            const fieldSlots = [];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Main Field');
        });

        it('should handle venue + field without fieldSlots', () => {
            const venue = 'Bowring Park';
            const field = 'Field A';

            const result = formatFieldName(venue, field);
            expect(result).toBe('Bowring Park - Field A');
        });

        it('should handle venue only', () => {
            const venue = 'Bowring Park';

            const result = formatFieldName(venue);
            expect(result).toBe('Bowring Park - Main Field');
        });

        it('should handle field only', () => {
            const field = 'Field A';

            const result = formatFieldName(undefined, field);
            expect(result).toBe('Field A');
        });

        it('should return Main Field as default', () => {
            const result = formatFieldName();
            expect(result).toBe('Main Field');
        });

        it('should handle empty strings', () => {
            const result = formatFieldName('', '');
            expect(result).toBe('Main Field');
        });

        it('should handle null values', () => {
            const result = formatFieldName(null, null);
            expect(result).toBe('Main Field');
        });

        it('should handle empty fieldSlots array', () => {
            const venue = 'Bowring Park';
            const field = 'Field A';
            const fieldSlots: string[] = [];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Field A');
        });

        it('should use Main Field fallback when fieldSlots has empty first element', () => {
            const venue = 'Bowring Park';
            const field = null;
            const fieldSlots = ['', 'Field B'];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Main Field');
        });

        it('should prioritize specific field over fieldSlots when both present', () => {
            const venue = 'Bowring Park';
            const field = 'Specific Field';
            const fieldSlots = ['Field A', 'Field B'];

            const result = formatFieldName(venue, field, fieldSlots);
            expect(result).toBe('Bowring Park - Specific Field');
        });

        it('should handle venue with whitespace', () => {
            const venue = '  Bowring Park  ';
            const field = 'Field A';

            const result = formatFieldName(venue, field);
            expect(result).toBe('  Bowring Park   - Field A');
        });
    });
});