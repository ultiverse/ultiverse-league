import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill for jsdom compatibility
global.structuredClone = global.structuredClone ?? ((val) => JSON.parse(JSON.stringify(val)));

// Mock window.URL.createObjectURL for CSV downloads
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-object-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock document.createElement and DOM manipulation for CSV downloads
const mockLink = {
  click: vi.fn(),
  setAttribute: vi.fn(),
  style: {},
};

const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as unknown as HTMLAnchorElement;
  }
  return originalCreateElement.call(document, tagName);
});

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();