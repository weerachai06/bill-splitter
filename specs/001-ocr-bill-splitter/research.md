# Research Findings: OCR Bill Splitter

**Date**: 2025-12-20  
**Phase**: Phase 0 - Research & Resolution  
**Purpose**: Resolve technical unknowns and establish implementation approach

## Google Cloud Vision API Integration

### Decision: Google Cloud Vision API for OCR Processing

**Rationale**: 
- Superior accuracy compared to Tesseract.js, especially for receipts with varied fonts and layouts
- Built-in text detection and document text detection capabilities
- Handles multiple languages and character sets including Thai numbers
- Cloud-based processing reduces client-side computational load
- Robust error handling and confidence scoring

**Implementation Approach**:
- Use `@google-cloud/vision` SDK on backend for secure API key management  
- Frontend uploads images to backend endpoint for OCR processing
- Alternative: Direct browser integration with API key restrictions for pure frontend solution
- Response caching to minimize API costs for repeated processing

**Alternatives Considered**:
- **Tesseract.js**: Rejected due to lower accuracy on complex receipts and larger bundle size
- **AWS Textract**: Rejected due to higher complexity for document structure parsing
- **Azure Computer Vision**: Rejected due to less robust multi-language support

### Best Practices for Receipt OCR

**Image Preprocessing**:
- Convert to grayscale for better text detection
- Apply contrast enhancement for low-quality images
- Resize images to optimal resolution (1024-2048px width)
- Support JPEG, PNG, and HEIC formats with automatic conversion

**Text Processing Pipeline**:
- Use document text detection for structured layout analysis
- Implement confidence threshold filtering (>70% confidence)
- Post-process extracted text with regex patterns for price normalization
- Handle quantity patterns like "2x$10.50" and "3×Coffee"

## Web Worker Implementation for OCR

### Decision: Dedicated Web Worker for Image Processing

**Rationale**:
- Prevents UI blocking during image upload and processing operations
- Enables background compression and format conversion
- Allows concurrent processing of multiple images
- Better error isolation and recovery

**Implementation Strategy**:
- Worker handles image compression, format conversion, and API communication
- Main thread receives processed results via postMessage
- Implement progress tracking for large image processing
- Use transfer objects for efficient memory management

**Technical Details**:
```typescript
// Worker responsibilities:
// 1. Image compression and optimization
// 2. Format conversion (HEIC → JPEG)
// 3. API communication with Google Cloud Vision
// 4. Progress reporting to main thread
// 5. Error handling and retry logic
```

**Alternatives Considered**:
- **Main thread processing**: Rejected due to UI blocking concerns
- **Service worker**: Rejected as it's designed for background sync, not compute tasks
- **WebAssembly**: Considered for future optimization but unnecessary complexity for MVP

## Decimal Arithmetic for Financial Calculations

### Decision: Decimal.js for Frontend, Rust decimal crate for Backend

**Rationale**:
- JavaScript Number type suffers from floating-point precision errors (0.1 + 0.2 ≠ 0.3)
- Financial applications require exact decimal arithmetic per constitutional requirements
- Decimal.js provides immutable decimal operations with configurable precision
- Rust `decimal` crate offers high-performance decimal arithmetic with PostgreSQL integration

**Frontend Implementation (Decimal.js)**:
```typescript
import Decimal from 'decimal.js';

// Configure for financial precision (2 decimal places, bankers rounding)
Decimal.config({
  precision: 10,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -9,
  toExpPos: 9
});

// All monetary calculations
const unitPrice = new Decimal('12.99');
const quantity = new Decimal('3');
const total = unitPrice.mul(quantity); // Exact: 38.97
```

**Backend Implementation (rust_decimal)**:
```rust
use decimal::d128;
use diesel::sql_types::Numeric;

// Database model with decimal precision
#[derive(Queryable, Selectable)]
pub struct LineItem {
    pub id: i32,
    pub unit_price: d128, // Maps to NUMERIC(10,2) in PostgreSQL
    pub quantity: i32,
    pub total_price: d128,
}
```

**Database Schema**:
- Use `NUMERIC(10,2)` type for all monetary values in PostgreSQL
- Supports exact decimal storage with 2 decimal place precision
- Prevents floating-point conversion errors in database layer

**Alternatives Considered**:
- **JavaScript Number**: Rejected due to precision errors with financial calculations
- **Integer cents**: Rejected due to complexity in UI display and international currency support
- **BigNumber.js**: Rejected in favor of Decimal.js for better API and smaller bundle size

## PostgreSQL Integration with Rust Diesel

### Decision: Diesel ORM with PostgreSQL NUMERIC Types

**Rationale**:
- Diesel provides compile-time query verification and type safety
- Excellent PostgreSQL integration with decimal type support
- Migration system ensures schema versioning and rollbacks
- Connection pooling and transaction management built-in

**Database Design Patterns**:
```sql
-- Migration for decimal precision tables
CREATE TABLE line_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraints for data integrity
ALTER TABLE line_items 
ADD CONSTRAINT positive_prices CHECK (unit_price >= 0 AND total_price >= 0);
```

**ACID Transaction Patterns**:
- Wrap bill splitting calculations in database transactions
- Use optimistic locking for concurrent bill modifications
- Implement rollback procedures for calculation errors

**Alternatives Considered**:
- **SQLx**: Rejected in favor of Diesel for compile-time query checking
- **SeaORM**: Rejected due to less mature PostgreSQL decimal integration
- **Raw SQL**: Rejected due to lack of type safety and migration management

## Image Processing Optimization

### Decision: Client-Side Preprocessing with Server-Side OCR

**Rationale**:
- Reduce bandwidth and API costs by optimizing images before upload
- Faster OCR processing with properly sized and formatted images
- Better user experience with immediate visual feedback
- Fallback handling for various image formats and qualities

**Optimization Pipeline**:
1. **Client-side preprocessing**:
   - Resize to optimal dimensions (max 2048px width)
   - Convert HEIC to JPEG for broader compatibility
   - Apply basic contrast and sharpening filters
   - Compress to balance quality vs. file size (85% JPEG quality)

2. **Server-side processing**:
   - Validate image format and size limits
   - Additional preprocessing if needed (grayscale conversion)
   - Google Cloud Vision API integration
   - Response caching for repeated requests

**Implementation Tools**:
- **Frontend**: Canvas API for image manipulation, File API for uploads
- **Backend**: Image crate in Rust for additional processing if needed
- **Caching**: Redis or in-memory cache for processed OCR results

**Performance Targets**:
- Image preprocessing: <2 seconds for 5MB images
- OCR processing: <10 seconds total (including API call)
- Bundle size impact: <50KB for image processing utilities

## Risk Mitigation & Fallbacks

### OCR Processing Failures
- **Graceful degradation**: Allow manual receipt entry if OCR fails
- **Retry mechanisms**: Implement exponential backoff for API failures
- **Offline capabilities**: Cache processed results for offline bill splitting

### Image Quality Issues
- **User guidance**: Provide tips for better receipt photos (lighting, angle, focus)
- **Preprocessing feedback**: Show enhanced image preview before processing
- **Manual correction**: Comprehensive editing interface for OCR results

### Performance Constraints
- **Progressive enhancement**: Core functionality works without image upload
- **Lazy loading**: Load OCR features only when needed
- **Error boundaries**: Isolate OCR failures from bill splitting functionality

## Technology Integration Summary

**Frontend Stack**:
- Next.js 16+ with App Router for optimal performance
- Decimal.js for exact financial calculations  
- Canvas API for image preprocessing
- Web Workers for background OCR processing

**Backend Stack**:
- Rust with Axum framework for high-performance API
- Diesel ORM with PostgreSQL for ACID-compliant data storage
- rust_decimal crate for server-side decimal arithmetic
- Google Cloud Vision SDK for OCR processing

**Shared Contracts**:
- TypeScript interfaces in `/shared` directory
- OpenAPI schema generation for API documentation
- Decimal string representation for API data transfer

This research establishes a solid foundation for implementing the OCR bill splitter with proper financial calculation precision, robust OCR processing, and constitutional compliance.

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