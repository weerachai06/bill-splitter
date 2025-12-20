# Data Model: OCR Bill Splitter

**Feature**: OCR Bill Splitter  
**Date**: December 20, 2025  
**Phase**: 1 - Design

## Core Entities

### Receipt

Digital representation of a scanned bill with extracted and processed data.

**Fields**:
- `id`: string - Unique identifier for the receipt
- `originalImageUrl`: string | null - URL or path to original uploaded image
- `ocrText`: string - Raw text extracted from OCR processing
- `processedAt`: Date - When OCR processing completed
- `status`: 'processing' | 'completed' | 'error' - Processing status

**Validation Rules**:
- ID must be unique within session
- Original image must be valid image format (JPEG, PNG, HEIC)
- OCR text may be empty if processing failed
- Status must be one of allowed values

**State Transitions**:
- `processing` → `completed` when OCR succeeds
- `processing` → `error` when OCR fails
- `completed` ↔ Manual editing (remains completed)

### LineItem

Individual product or service entry extracted from receipt with pricing information.

**Fields**:
- `id`: string - Unique identifier for line item  
- `receiptId`: string - Foreign key to parent receipt
- `name`: string - Item name/description
- `quantity`: number - Number of items (default: 1)
- `unitPrice`: Decimal - Price per individual item
- `totalPrice`: Decimal - Total price for this line (quantity × unitPrice)
- `category`: string | null - Optional item category
- `isShared`: boolean - Whether item can be split among people
- `extractedText`: string - Original OCR text for this item
- `manuallyEdited`: boolean - Whether user modified OCR results

**Validation Rules**:
- Name must not be empty after trimming
- Quantity must be positive number
- Unit price must be non-negative decimal
- Total price must equal quantity × unitPrice
- Extracted text preserves original OCR for audit

**Relationships**:
- Belongs to one Receipt
- Can be assigned to multiple People through ItemAssignments
- Must have at least one assignment when bill is finalized

### Person

Individual participant in the bill split with calculation results.

**Fields**:
- `id`: string - Unique identifier for person
- `name`: string - Display name for person
- `email`: string | null - Optional email for notifications/exports
- `subtotal`: Decimal - Sum of assigned item costs (calculated)
- `taxAmount`: Decimal - Proportional tax allocation (calculated)
- `tipAmount`: Decimal - Proportional tip allocation (calculated)
- `totalOwed`: Decimal - Final amount owed (calculated)
- `color`: string - UI color for visual identification

**Validation Rules**:
- Name must not be empty after trimming
- Email must be valid format if provided
- Monetary amounts are calculated fields, not user-editable
- Color must be valid hex color code

**Calculations**:
- `subtotal` = Sum of all assigned line item costs
- `taxAmount` = (subtotal / billSubtotal) × totalTax
- `tipAmount` = (subtotal / billSubtotal) × totalTip
- `totalOwed` = subtotal + taxAmount + tipAmount

### ItemAssignment

Junction entity linking line items to people for split calculation.

**Fields**:
- `lineItemId`: string - Foreign key to LineItem
- `personId`: string - Foreign key to Person
- `sharePercentage`: Decimal - Percentage of item cost (0.0-1.0)
- `assignedAmount`: Decimal - Calculated cost for this assignment

**Validation Rules**:
- Share percentage must be between 0.0 and 1.0
- Sum of share percentages for each line item must equal 1.0
- Assigned amount = lineItem.totalPrice × sharePercentage

**Constraints**:
- Composite primary key (lineItemId, personId)
- Each line item must have at least one assignment
- Total assignments per line item must sum to 100%

### BillSummary

Aggregate calculations for the entire bill with tax and tip handling.

**Fields**:
- `receiptId`: string - Foreign key to Receipt
- `subtotal`: Decimal - Sum of all line item totals
- `taxAmount`: Decimal - Total tax amount
- `tipAmount`: Decimal - Total tip amount
- `totalAmount`: Decimal - Final bill total
- `peopleCount`: number - Number of people splitting bill
- `calculatedAt`: Date - When calculations were last updated

**Validation Rules**:
- All monetary amounts must be non-negative
- Total amount must equal subtotal + tax + tip
- People count must be positive integer
- Calculated timestamp updated on any assignment change

**Business Rules**:
- Tax is distributed proportionally based on subtotal percentages
- Tip is distributed proportionally based on subtotal percentages  
- Rounding differences are added to first person's total
- All calculations use decimal arithmetic for precision

## Entity Relationships

```text
Receipt (1) ──── (M) LineItem
Person (M) ──── (M) LineItem  [through ItemAssignment]
Receipt (1) ──── (1) BillSummary
```

## State Management

### Application State Shape

```typescript
interface BillSplitterState {
  // Current session data
  receipt: Receipt | null;
  lineItems: LineItem[];
  people: Person[];
  assignments: ItemAssignment[];
  summary: BillSummary | null;
  
  // UI state
  currentStep: 'upload' | 'ocr' | 'edit' | 'split' | 'results';
  processing: boolean;
  errors: string[];
  
  // OCR specific
  ocrProgress: number;
  ocrStatus: string;
}
```

### State Transitions

1. **Upload** → OCR: File uploaded, processing begins
2. **OCR** → Edit: Text extracted, line items parsed
3. **Edit** → Split: User confirms/corrects items
4. **Split** → Results: People assigned, calculations complete
5. **Results** → Export: Final amounts displayed

### Data Flow

1. User uploads image → Receipt created with 'processing' status
2. OCR worker extracts text → Receipt updated with OCR results
3. Text parsing creates initial LineItems → User reviews/edits
4. User adds People → Creates Person entities
5. User assigns items → Creates ItemAssignments
6. System calculates split → Updates BillSummary
7. Results displayed → Export options available

## Persistence Strategy

### Session Storage (MVP)

- All data stored in browser sessionStorage
- JSON serialization with decimal preservation
- Automatic save on state changes
- Clear data on browser close/refresh

### Future Database Schema (PostgreSQL)

```sql
-- Future schema for persistent storage
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  original_image_url TEXT,
  ocr_text TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL
);

CREATE TABLE line_items (
  id UUID PRIMARY KEY,
  receipt_id UUID REFERENCES receipts(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  extracted_text TEXT,
  manually_edited BOOLEAN DEFAULT FALSE
);

CREATE TABLE people (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  color VARCHAR(7) -- Hex color
);

CREATE TABLE item_assignments (
  line_item_id UUID REFERENCES line_items(id),
  person_id UUID REFERENCES people(id),
  share_percentage DECIMAL(5,4) NOT NULL,
  assigned_amount DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (line_item_id, person_id)
);
```