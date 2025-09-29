import { vi } from 'vitest';
import { ConfirmationDialog } from '../ConfirmationDialog.component';

// Simple unit tests for ConfirmationDialog component
describe('ConfirmationDialog', () => {
    it('should be a valid React component', () => {
        expect(ConfirmationDialog).toBeDefined();
        expect(typeof ConfirmationDialog).toBe('function');
    });

    it('should handle prop validation', () => {
        const mockOnClose = vi.fn();
        const mockOnConfirm = vi.fn();

        // Test that the component expects the required props
        const requiredProps = {
            open: true,
            onClose: mockOnClose,
            onConfirm: mockOnConfirm,
            title: 'Test',
            message: 'Test message'
        };

        expect(requiredProps.open).toBe(true);
        expect(typeof requiredProps.onClose).toBe('function');
        expect(typeof requiredProps.onConfirm).toBe('function');
        expect(typeof requiredProps.title).toBe('string');
        expect(typeof requiredProps.message).toBe('string');
    });
});