# Phase 1 Data Model: Smart Bill Summary

**Feature**: Smart Bill Summary with Field Filtering  
**Data Design Phase**: Entity relationships and validation rules  
**Date**: December 20, 2025

## Core Entities

### ReceiptImage
**Purpose**: Represents uploaded receipt image with processing metadata
```typescript
interface ReceiptImage {
  id: string;                    // Unique identifier for processing session
  file: File;                    // Original image file
  uploadedAt: Date;             // Timestamp of upload
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: OCRResult;          // Raw OCR extraction results
  language?: string;            // Detected language code (en, de, th)
  imageMetadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
  };
}
```

**Validation Rules:**
- `id` must be unique within session
- `file` must be valid image format (JPEG, PNG, WebP)
- `imageMetadata.fileSize` must be < 10MB
- `language` must be supported language code or undefined

### OCRResult
**Purpose**: Raw text extraction data from image processing
```typescript
interface OCRResult {
  fullText: string;             // Complete extracted text
  lines: TextLine[];           // Structured line-by-line data
  detectedLanguage: string;    // Primary language detected
  confidence: number;          // Overall extraction confidence (0-1)
  boundingBoxes: BoundingBox[]; // Text position data for layout analysis
  processingTime: number;      // Processing duration in milliseconds
}

interface TextLine {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  lineNumber: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

**Validation Rules:**
- `confidence` must be between 0 and 1
- `lines` must be ordered by `lineNumber`
- `fullText` should equal concatenated `lines.text`

### FieldClassification
**Purpose**: Categorization of receipt content into essential vs non-essential
```typescript
interface FieldClassification {
  lineId: number;              // Reference to TextLine.lineNumber
  category: FieldCategory;     // Classification result
  confidence: number;          // Classification confidence (0-1)
  extractedData?: ExtractedField; // Structured data if applicable
  userOverride?: boolean;      // User manually corrected classification
}

enum FieldCategory {
  ITEM = 'item',              // Purchasable item with price
  QUANTITY = 'quantity',      // Quantity indicator
  PRICE = 'price',           // Price information
  TOTAL = 'total',           // Total, subtotal, tax amounts
  MERCHANT = 'merchant',     // Store name and basic info
  DATE = 'date',            // Transaction date/time
  PROMOTIONAL = 'promotional', // Marketing content
  CONTACT = 'contact',       // Phone, email, website
  LEGAL = 'legal',          // Terms, disclaimers
  OPERATIONAL = 'operational', // Hours, policies
  UNKNOWN = 'unknown'        // Unclassified content
}
```

**Validation Rules:**
- `confidence` must be between 0 and 1
- `lineId` must reference valid TextLine
- `userOverride` implies user reviewed the classification

### ExtractedField
**Purpose**: Structured data parsed from classified text lines
```typescript
interface ExtractedField {
  type: FieldCategory;
  value: string | number | Date; // Parsed value in appropriate type
  rawText: string;              // Original text before parsing
  currency?: CurrencyInfo;      // For price/total fields
  unit?: string;               // For quantity fields (kg, ea, lbs)
  associatedLines?: number[];   // Related line numbers (multi-line items)
}

interface CurrencyInfo {
  code: string;                // ISO currency code (USD, EUR, THB)
  symbol: string;             // Currency symbol ($, €, ฿)
  amount: Decimal;            // Decimal amount for precise calculations
}
```

**Validation Rules:**
- `type` must match parent FieldClassification.category
- `currency.code` must be valid ISO 4217 code
- `currency.amount` must use Decimal type for precision
- `associatedLines` must reference valid line numbers

### FilteringProfile
**Purpose**: User-defined rules for content inclusion/exclusion
```typescript
interface FilteringProfile {
  id: string;
  name: string;               // User-friendly profile name
  isDefault: boolean;         // Default profile for new uploads
  includeCategories: FieldCategory[]; // Categories to include in output
  excludePatterns: string[];  // Regex patterns for content exclusion
  csvColumnMapping: ColumnMapping; // CSV export configuration
  createdAt: Date;
  lastModified: Date;
}

interface ColumnMapping {
  itemName: string;           // CSV column name for item descriptions
  quantity: string;          // CSV column name for quantities
  unitPrice: string;         // CSV column name for unit prices
  lineTotal: string;         // CSV column name for line totals
  category: string;          // CSV column name for item categories
  merchant: string;          // CSV column name for merchant name
  date: string;              // CSV column name for transaction date
  customFields: Record<string, string>; // Additional user-defined columns
}
```

**Validation Rules:**
- `name` must be unique per user session
- `includeCategories` must contain at least one category
- `excludePatterns` must be valid regex strings
- Only one profile can have `isDefault: true`

### CleanSummary
**Purpose**: Filtered and structured output ready for export
```typescript
interface CleanSummary {
  sourceImageId: string;      // Reference to ReceiptImage.id
  profileId: string;          // FilteringProfile used for generation
  generatedAt: Date;
  items: SummaryItem[];       // Extracted and filtered line items
  totals: SummaryTotals;      // Calculated totals and tax information
  metadata: SummaryMetadata;  // Processing and filtering metadata
}

interface SummaryItem {
  name: string;               // Clean item description
  quantity: Decimal;          // Parsed quantity as decimal
  unitPrice: Decimal;         // Price per unit
  lineTotal: Decimal;         // Total for this line item
  category?: string;          // Item category if detectable
  originalLines: number[];    // Source lines from OCR
}

interface SummaryTotals {
  subtotal: Decimal;          // Sum of line items
  tax: Decimal;              // Total tax amount
  total: Decimal;            // Final total amount
  currency: CurrencyInfo;    // Currency information
}

interface SummaryMetadata {
  itemCount: number;          // Number of items extracted
  linesProcessed: number;     // Total OCR lines processed
  linesFiltered: number;      // Lines excluded by filtering
  processingTime: number;     // Time to generate summary (ms)
  manualCorrections: number;  // User overrides applied
}
```

**Validation Rules:**
- `sourceImageId` must reference valid ReceiptImage
- All Decimal amounts must use consistent precision
- `totals.total` should equal `subtotal + tax`
- `itemCount` must equal `items.length`

## Entity Relationships

```
ReceiptImage (1) → (1) OCRResult
     ↓
OCRResult.lines (1) → (0..1) FieldClassification
     ↓
FieldClassification (1) → (0..1) ExtractedField
     ↓
ExtractedField + FilteringProfile → CleanSummary
     ↓
CleanSummary → CSV Export
```

## State Transitions

### Receipt Processing Flow
1. **Upload**: ReceiptImage created with status 'pending'
2. **OCR**: Status → 'processing', OCRResult generated
3. **Classification**: FieldClassification records created for each line
4. **Filtering**: FilteringProfile applied to create CleanSummary
5. **Export**: CSV generation from CleanSummary data
6. **Completion**: Status → 'completed'

### Error States
- **OCR Failure**: Status → 'failed', error details in metadata
- **Classification Issues**: Low confidence fields marked for user review
- **Filtering Conflicts**: Profile validation errors prevent summary generation

## Validation and Business Rules

### Financial Data Integrity
- All monetary values use Decimal type to prevent floating-point errors
- Currency conversion rates stored with precision metadata
- Tax calculations validated against item sum totals

### Content Filtering Rules
- Essential data (items, prices, totals) cannot be filtered out
- User overrides take precedence over automatic classification
- Filtering profiles validated before applying to prevent data loss

### User Experience Rules
- Processing timeout after 30 seconds with graceful degradation
- User corrections stored for improving future classifications
- Batch processing maintains individual item accuracy across all receipts

### Data Retention
- OCR results cached during session for re-filtering
- User profiles persisted in local storage
- Temporary files cleaned up after successful processing

## Performance Considerations

### Memory Management
- Large images processed in chunks to prevent memory issues
- OCR results cached efficiently with cleanup after export
- Batch processing queued to prevent browser resource exhaustion

### Processing Optimization
- Client-side filtering reduces server load
- Image compression before OCR to improve processing speed
- Progressive enhancement for real-time preview during filtering

This data model supports all three user requirements: CSV conversion, unnecessary field removal, and item separation while maintaining constitutional compliance for financial data integrity.