// OCR Bill Splitter - Shared Type Definitions
// This file defines the TypeScript interfaces for the OCR Bill Splitter feature
// Generated from: specs/001-ocr-bill-splitter/data-model.md

export type Decimal = string; // Decimal values as strings to avoid floating point errors
export type UUID = string;
export type Color = string; // Hex color format: #RRGGBB

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
  unitPrice: Decimal;
  totalPrice: Decimal;
  category: string | null;
  isShared: boolean;
  extractedText: string;
  manuallyEdited: boolean;
}

export interface Person {
  id: UUID;
  name: string;
  email: string | null;
  subtotal: Decimal;
  taxAmount: Decimal;
  tipAmount: Decimal;
  totalOwed: Decimal;
  color: Color;
}

export interface ItemAssignment {
  lineItemId: UUID;
  personId: UUID;
  sharePercentage: Decimal; // 0.0000 to 1.0000
  assignedAmount: Decimal;
}

export interface BillSummary {
  receiptId: UUID;
  subtotal: Decimal;
  taxAmount: Decimal;
  tipAmount: Decimal;
  totalAmount: Decimal;
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

// Action Types for State Management

export type BillSplitterAction =
  | { type: 'SET_RECEIPT'; payload: Receipt }
  | { type: 'SET_LINE_ITEMS'; payload: LineItem[] }
  | { type: 'UPDATE_LINE_ITEM'; payload: { id: UUID; updates: Partial<LineItem> } }
  | { type: 'ADD_LINE_ITEM'; payload: LineItem }
  | { type: 'REMOVE_LINE_ITEM'; payload: UUID }
  | { type: 'SET_PEOPLE'; payload: Person[] }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: { id: UUID; updates: Partial<Person> } }
  | { type: 'REMOVE_PERSON'; payload: UUID }
  | { type: 'SET_ASSIGNMENTS'; payload: ItemAssignment[] }
  | { type: 'UPDATE_ASSIGNMENT'; payload: ItemAssignment }
  | { type: 'REMOVE_ASSIGNMENTS'; payload: { lineItemId?: UUID; personId?: UUID } }
  | { type: 'SET_SUMMARY'; payload: BillSummary }
  | { type: 'SET_STEP'; payload: AppStep }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_OCR_PROGRESS'; payload: { progress: number; status: string } }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// API Request/Response Types

export interface BillValidationRequest {
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  subtotal: Decimal;
  taxAmount: Decimal;
  tipAmount: Decimal;
  totalAmount: Decimal;
}

export interface BillValidationResponse {
  valid: boolean;
  calculatedTotals: {
    subtotal: Decimal;
    taxAmount: Decimal;
    tipAmount: Decimal;
    totalAmount: Decimal;
  };
  discrepancies: Array<{
    field: string;
    expected: Decimal;
    actual: Decimal;
    difference: Decimal;
  }>;
}

export interface BillCalculationRequest {
  lineItems: LineItem[];
  assignments: ItemAssignment[];
  taxRate: Decimal; // as decimal (0.1300 for 13%)
  tipAmount: Decimal;
}

export interface BillCalculationResponse {
  summary: BillSummary;
  personTotals: PersonTotal[];
  calculations: {
    subtotal: Decimal;
    taxAmount: Decimal;
    totalAmount: Decimal;
    timestamp: string; // ISO date string
  };
}

export interface PersonTotal {
  personId: UUID;
  personName: string;
  subtotal: Decimal;
  taxAmount: Decimal;
  tipAmount: Decimal;
  totalOwed: Decimal;
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

// OCR Worker Types

export interface OCRWorkerMessage {
  type: 'PROCESS_IMAGE' | 'OCR_PROGRESS' | 'OCR_COMPLETE' | 'OCR_ERROR';
  payload: any;
}

export interface OCRProcessRequest {
  imageFile: File;
  options: {
    lang: string;
    debug: boolean;
  };
}

export interface OCRProgressEvent {
  status: string;
  progress: number; // 0-100
  workerId: string;
}

export interface OCRCompleteEvent {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  processingTime: number; // milliseconds
}

export interface OCRErrorEvent {
  error: string;
  message: string;
  details?: any;
}

// Utility Types

export type CreatePersonData = Omit<Person, 'id' | 'subtotal' | 'taxAmount' | 'tipAmount' | 'totalOwed'>;
export type CreateLineItemData = Omit<LineItem, 'id' | 'receiptId'>;
export type CreateReceiptData = Omit<Receipt, 'id' | 'processedAt' | 'status'>;

// Component Prop Types

export interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  currentImage: File | null;
  disabled: boolean;
}

export interface OCRProcessorProps {
  imageFile: File;
  onOCRComplete: (result: OCRCompleteEvent) => void;
  onOCRProgress: (event: OCRProgressEvent) => void;
  onOCRError: (error: OCRErrorEvent) => void;
}

export interface LineItemEditorProps {
  items: LineItem[];
  onItemUpdate: (id: UUID, updates: Partial<LineItem>) => void;
  onItemAdd: (item: CreateLineItemData) => void;
  onItemRemove: (id: UUID) => void;
  readonly: boolean;
}

export interface PersonManagerProps {
  people: Person[];
  onPersonAdd: (person: CreatePersonData) => void;
  onPersonUpdate: (id: UUID, updates: Partial<Person>) => void;
  onPersonRemove: (id: UUID) => void;
  readonly: boolean;
}

export interface ItemAssignmentProps {
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  onAssignmentUpdate: (assignment: ItemAssignment) => void;
  onAssignmentsChange: (assignments: ItemAssignment[]) => void;
}

export interface SplitCalculatorProps {
  summary: BillSummary;
  personTotals: PersonTotal[];
  onCalculationUpdate: () => void;
}

// Validation Helper Types

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Constants and Enums

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const PERSON_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F1', 
  '#F1FF33', '#FF8C33', '#33FFF1', '#8C33FF'
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];
export type PersonColor = typeof PERSON_COLORS[number];