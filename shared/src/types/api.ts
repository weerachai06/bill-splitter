// API types for backend communication

import { LineItem, Person, ItemAssignment, BillSummary, DecimalString, UUID } from './bill.js';

// Request/Response Types

export interface BillValidationRequest {
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  subtotal: DecimalString;
  taxAmount: DecimalString;
  tipAmount: DecimalString;
  totalAmount: DecimalString;
}

export interface BillValidationResponse {
  valid: boolean;
  calculatedTotals: {
    subtotal: DecimalString;
    taxAmount: DecimalString;
    tipAmount: DecimalString;
    totalAmount: DecimalString;
  };
  discrepancies: Array<{
    field: string;
    expected: DecimalString;
    actual: DecimalString;
    difference: DecimalString;
  }>;
}

export interface BillCalculationRequest {
  lineItems: LineItem[];
  assignments: ItemAssignment[];
  taxRate: DecimalString; // as decimal (0.1300 for 13%)
  tipAmount: DecimalString;
}

export interface BillCalculationResponse {
  summary: BillSummary;
  personTotals: PersonTotal[];
  calculations: {
    subtotal: DecimalString;
    taxAmount: DecimalString;
    totalAmount: DecimalString;
    timestamp: string; // ISO date string
  };
}

export interface PersonTotal {
  personId: UUID;
  personName: string;
  subtotal: DecimalString;
  taxAmount: DecimalString;
  tipAmount: DecimalString;
  totalOwed: DecimalString;
}

export interface ExportResponse {
  format: 'json' | 'csv' | 'pdf';
  data: object | string;
  generatedAt: string; // ISO date string
}

// Error Types

export interface APIError {
  error: string;
  message: string;
  details?: string[];
}

export interface ValidationError extends APIError {
  validationErrors: Array<{
    field: string;
    code: string;
    message: string;
    expected?: string;
    actual?: string;
  }>;
}