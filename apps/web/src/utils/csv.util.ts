/**
 * Generic CSV utility functions for creating and downloading CSV files
 */

export function formatCSVField(value: string | number | null | undefined): string {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
}

export function createCSVContent(rows: (string | number | null | undefined)[][]): string {
    return rows
        .map(row => row.map(formatCSVField).join(','))
        .join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export function generateCSVFileName(prefix: string, suffix?: string): string {
    const today = new Date().toISOString().split('T')[0];
    const sanitizedSuffix = suffix?.replace(/[^a-zA-Z0-9]/g, '_') || 'export';
    return `${prefix}_${sanitizedSuffix}_${today}.csv`;
}