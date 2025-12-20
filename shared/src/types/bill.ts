// OCR Bill Splitter - Shared Type Definitions
// Core entity types for the bill splitter application

import { Decimal } from 'decimal.js';

export type UUID = string;
export type Color = string; // Hex color format: #RRGGBB
export type DecimalString = string; // Decimal values as strings to avoid floating point errors

// Core Entity Types

export interface Receipt {
  id: UUID;
  originalImageUrl: string | null;
  ocrText: string;
  processedAt: Date;
  status: 'processing' | 'completed' | 'error';
}

export interface LineItem {
  id: UUID;
  receiptId: UUID;
  name: string;
  quantity: number;
  unitPrice: DecimalString;
  totalPrice: DecimalString;
  category: string | null;
  isShared: boolean;
  extractedText: string;
  manuallyEdited: boolean;
}

export interface Person {
  id: UUID;
  name: string;
  email: string | null;
  subtotal: DecimalString;
  taxAmount: DecimalString;
  tipAmount: DecimalString;
  totalOwed: DecimalString;
  color: Color;
}

export interface ItemAssignment {
  lineItemId: UUID;
  personId: UUID;
  sharePercentage: DecimalString; // 0.0000 to 1.0000
  assignedAmount: DecimalString;
}

export interface BillSummary {
  receiptId: UUID;
  subtotal: DecimalString;
  taxAmount: DecimalString;
  tipAmount: DecimalString;
  totalAmount: DecimalString;
  peopleCount: number;
  calculatedAt: Date;
}

// Application State Types

export type AppStep = 'upload' | 'ocr' | 'edit' | 'split' | 'results';

export interface BillSplitterState {
  // Current session data
  receipt: Receipt | null;
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  summary: BillSummary | null;
  
  // UI state
  currentStep: AppStep;
  processing: boolean;
  errors: string[];
  
  // OCR specific
  ocrProgress: number;
  ocrStatus: string;
}

// Utility Types for Creation
export type CreatePersonData = Omit<Person, 'id' | 'subtotal' | 'taxAmount' | 'tipAmount' | 'totalOwed'>;
export type CreateLineItemData = Omit<LineItem, 'id' | 'receiptId'>;
export type CreateReceiptData = Omit<Receipt, 'id' | 'processedAt' | 'status'>;

// Constants
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const PERSON_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F1', 
  '#F1FF33', '#FF8C33', '#33FFF1', '#8C33FF'
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];
export type PersonColor = typeof PERSON_COLORS[number];