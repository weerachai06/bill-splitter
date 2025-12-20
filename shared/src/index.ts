// Main export file for shared types
export * from './types/bill';
export * from './types/ocr';

// Constants
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes