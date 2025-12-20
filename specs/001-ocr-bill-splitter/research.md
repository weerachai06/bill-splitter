# Research: OCR Bill Splitter

**Feature**: OCR Bill Splitter  
**Date**: December 20, 2025  
**Phase**: 0 - Research & Outline

## Technical Decisions

### OCR Library Choice: Tesseract.js

**Decision**: Use Tesseract.js for client-side OCR processing  
**Rationale**: 
- No server-side dependencies or API keys required
- Runs entirely in browser with web worker support
- Good accuracy for printed text on receipts
- Open source and actively maintained
- Supports multiple languages if needed

**Alternatives considered**:
- Google Vision API: Requires API keys and server integration
- AWS Textract: Cloud dependency and costs
- Azure Computer Vision: Microsoft lock-in

### Web Worker Implementation

**Decision**: Process OCR in dedicated web worker  
**Rationale**:
- Prevents UI blocking during image processing
- Better user experience with responsive interface
- Aligns with constitutional performance requirements
- Allows for progress feedback during processing

**Implementation approach**:
- Create dedicated OCR worker in `/frontend/src/workers/ocr.worker.ts`
- Use comlink for type-safe worker communication
- Implement progress callbacks for loading states

### Image Processing Pipeline

**Decision**: Multi-step image preprocessing before OCR  
**Rationale**:
- Improves OCR accuracy significantly
- Handles various lighting conditions
- Standardizes input format for consistent results

**Pipeline stages**:
1. Image compression and resizing (max 2048px width)
2. Contrast enhancement for receipt text
3. Grayscale conversion
4. Optional rotation correction
5. Tesseract processing with receipt-optimized settings

### Receipt Data Parsing Strategy

**Decision**: Pattern-based text extraction with manual fallback  
**Rationale**:
- Receipts have common patterns (item + price)
- Regex patterns can identify line items
- Manual editing handles edge cases
- Graceful degradation to manual entry

**Patterns to detect**:
- Line items: "Item Name ... $XX.XX" format
- Subtotal: "Subtotal", "Sub Total", etc.
- Tax: "Tax", "HST", "GST", percentage patterns
- Total: "Total", "Amount Due", etc.

### Frontend Architecture

**Decision**: Feature-based component organization  
**Rationale**:
- Clear separation of OCR, editing, and splitting concerns
- Reusable components for similar features
- Easy testing and maintenance

**Component structure**:
```
src/components/
├── ocr/
│   ├── ImageUpload.tsx
│   ├── OCRProcessor.tsx
│   └── ProcessingStatus.tsx
├── bill-editor/
│   ├── LineItemEditor.tsx
│   ├── ManualItemAdd.tsx
│   └── BillSummary.tsx
└── bill-splitter/
    ├── PersonManager.tsx
    ├── ItemAssignment.tsx
    └── SplitCalculator.tsx
```

### State Management

**Decision**: React Context + useReducer for bill state  
**Rationale**:
- Centralized state for bill data
- Predictable state updates
- No external dependencies needed
- Good performance for single-page feature

**State shape**:
```typescript
interface BillState {
  originalImage: File | null;
  ocrText: string;
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  totals: BillTotals;
  processing: boolean;
}
```

### Data Persistence

**Decision**: Session-only storage with optional export  
**Rationale**: 
- Simpler implementation without database schema
- Privacy-focused (no persistent user data)
- Export functionality for record keeping
- Aligns with single-session scope

**Export formats**: JSON, CSV for spreadsheet import

## API Requirements

### Minimal Backend Services

**Decision**: Simple REST API for bill calculations validation  
**Rationale**:
- Server-side validation of financial calculations
- Audit trail for mathematical operations  
- Consistent decimal arithmetic
- Future extension point

**Required endpoints**:
- `POST /api/bills/calculate` - Validate split calculations
- `GET /api/bills/:id/export` - Generate exportable formats
- `POST /api/bills/validate` - Validate bill data integrity

### Database Schema (Future)

**Decision**: Defer database implementation for MVP  
**Rationale**:
- Focus on core OCR and splitting functionality
- Avoid premature complexity
- Simpler deployment and testing

**Future schema considerations**:
- Bills table for persistence
- LineItems with foreign keys
- People and Assignments for complex splits

## Performance Optimizations

### Bundle Size Management

**Decision**: Code splitting for OCR functionality  
**Rationale**:
- Tesseract.js is ~2MB, should be loaded on demand
- Faster initial page load
- Better Core Web Vitals scores

**Implementation**:
- Dynamic import for OCR worker
- Lazy loading of OCR components
- Separate chunks for editing and splitting features

### Image Optimization

**Decision**: Client-side image compression before processing  
**Rationale**:
- Faster OCR processing with smaller images
- Reduced memory usage
- Better mobile device performance

**Compression strategy**:
- Canvas-based resizing to max 2048px width
- Quality reduction for very large images
- Progressive JPEG for storage

## Testing Strategy

### OCR Testing Approach

**Decision**: Synthetic receipt images for reliable testing  
**Rationale**:
- Consistent test results
- Cover various receipt formats
- No dependency on external images

**Test cases**:
- Simple 3-item restaurant receipt
- Complex grocery receipt with tax
- Poor quality/blurry image handling
- Non-receipt image rejection

### Component Testing

**Decision**: Jest + React Testing Library for all components  
**Rationale**:
- Aligns with constitutional requirements
- Good accessibility testing capabilities
- Mocks web worker interactions effectively

### Integration Testing

**Decision**: Playwright for full OCR-to-split workflow  
**Rationale**:
- End-to-end user journey testing
- File upload and worker interaction testing
- Visual regression testing capabilities