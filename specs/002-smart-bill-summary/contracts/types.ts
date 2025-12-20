/**
 * TypeScript interfaces for Smart Bill Summary feature
 * Generated from data-model.md for type safety across frontend components
 */

// Re-export from existing shared types
export * from '../../../shared/src/types/ocr';
export * from '../../../shared/src/types/bill';

// Smart Summary specific types

export interface ReceiptImage {
  id: string;
  file: File;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: OCRResult;
  language?: string;
  imageMetadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
  };
}

export interface OCRResult {
  fullText: string;
  lines: TextLine[];
  detectedLanguage: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  processingTime: number;
}

export interface TextLine {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  lineNumber: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum FieldCategory {
  ITEM = 'item',
  QUANTITY = 'quantity',
  PRICE = 'price',
  TOTAL = 'total',
  MERCHANT = 'merchant',
  DATE = 'date',
  PROMOTIONAL = 'promotional',
  CONTACT = 'contact',
  LEGAL = 'legal',
  OPERATIONAL = 'operational',
  UNKNOWN = 'unknown'
}

export interface FieldClassification {
  lineId: number;
  category: FieldCategory;
  confidence: number;
  extractedData?: ExtractedField;
  userOverride?: boolean;
}

export interface ExtractedField {
  type: FieldCategory;
  value: string | number | Date;
  rawText: string;
  currency?: CurrencyInfo;
  unit?: string;
  associatedLines?: number[];
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  amount: string; // String representation to maintain decimal precision
}

export interface FilteringProfile {
  id: string;
  name: string;
  isDefault: boolean;
  includeCategories: FieldCategory[];
  excludePatterns: string[];
  csvColumnMapping: ColumnMapping;
  createdAt: Date;
  lastModified: Date;
}

export interface ColumnMapping {
  itemName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  category: string;
  merchant: string;
  date: string;
  customFields: Record<string, string>;
}

export interface CleanSummary {
  sourceImageId: string;
  profileId: string;
  generatedAt: Date;
  items: SummaryItem[];
  totals: SummaryTotals;
  metadata: SummaryMetadata;
}

export interface SummaryItem {
  name: string;
  quantity: string; // Decimal as string
  unitPrice: string; // Decimal as string
  lineTotal: string; // Decimal as string
  category?: string;
  originalLines: number[];
}

export interface SummaryTotals {
  subtotal: string; // Decimal as string
  tax: string; // Decimal as string
  total: string; // Decimal as string
  currency: CurrencyInfo;
}

export interface SummaryMetadata {
  itemCount: number;
  linesProcessed: number;
  linesFiltered: number;
  processingTime: number;
  manualCorrections: number;
}

// Processing and export types

export interface ProcessingSession {
  id: string;
  receipts: ReceiptImage[];
  currentProfile: FilteringProfile;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: ProcessingError;
}

export interface ProcessingError {
  code: 'OCR_FAILED' | 'CLASSIFICATION_FAILED' | 'FILTERING_FAILED' | 'EXPORT_FAILED';
  message: string;
  receiptId?: string;
  retryable: boolean;
}

export interface CSVExportOptions {
  filename: string;
  includeHeaders: boolean;
  dateFormat: string;
  currencyFormat: string;
  encoding: 'utf-8' | 'utf-8-bom';
  delimiter: ',' | ';' | '\t';
}

export interface BatchProcessingResult {
  successful: CleanSummary[];
  failed: ProcessingError[];
  totalProcessed: number;
  processingTime: number;
}

// User interaction types

export interface UserCorrection {
  lineId: number;
  originalCategory: FieldCategory;
  correctedCategory: FieldCategory;
  timestamp: Date;
  confidence: number;
}

export interface FilteringRule {
  id: string;
  pattern: string; // Regex pattern
  action: 'include' | 'exclude';
  category: FieldCategory;
  isActive: boolean;
  userDefined: boolean;
}

// Component props interfaces

export interface ReceiptUploadProps {
  onImageUpload: (images: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  disabled?: boolean;
}

export interface FieldFilterEditorProps {
  profile: FilteringProfile;
  onProfileUpdate: (profile: FilteringProfile) => void;
  availableCategories: FieldCategory[];
}

export interface CleanSummaryViewProps {
  summary: CleanSummary;
  onItemEdit: (itemIndex: number, updates: Partial<SummaryItem>) => void;
  onCorrection: (correction: UserCorrection) => void;
  showOriginalData?: boolean;
}

export interface CSVExportPanelProps {
  summaries: CleanSummary[];
  exportOptions: CSVExportOptions;
  onExport: (data: string, filename: string) => void;
  onOptionsChange: (options: CSVExportOptions) => void;
}

export interface BatchProcessorProps {
  onBatchProcess: (images: File[], profile: FilteringProfile) => Promise<BatchProcessingResult>;
  profile: FilteringProfile;
  maxBatchSize?: number;
}

// State management types for React contexts

export interface SmartSummaryState {
  session: ProcessingSession | null;
  profiles: FilteringProfile[];
  activeProfile: FilteringProfile | null;
  recentSummaries: CleanSummary[];
  userCorrections: UserCorrection[];
  isProcessing: boolean;
}

export interface SmartSummaryActions {
  uploadImages: (files: File[]) => Promise<void>;
  processReceipts: (profileId: string) => Promise<void>;
  updateProfile: (profile: FilteringProfile) => void;
  deleteProfile: (profileId: string) => void;
  applyCorrection: (correction: UserCorrection) => void;
  exportToCSV: (summaries: CleanSummary[], options: CSVExportOptions) => void;
  clearSession: () => void;
}