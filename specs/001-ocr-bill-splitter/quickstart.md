# Quick Start: OCR Bill Splitter

**Feature**: OCR Bill Splitter  
**Date**: December 20, 2025  
**Phase**: 1 - Implementation Ready

## Overview

This guide provides everything needed to implement the OCR Bill Splitter feature that allows users to scan receipts, extract itemized data, and split bills among multiple people.

## Architecture Summary

- **Frontend**: Next.js 16+ with TypeScript, Tailwind CSS
- **OCR**: Tesseract.js with Web Worker for performance
- **State**: React Context + useReducer pattern
- **API**: Rust Axum backend for calculation validation
- **Database**: PostgreSQL (future), session storage (MVP)

## Implementation Order

### Phase 1: OCR Foundation (Priority 1)
1. Set up OCR web worker with Tesseract.js
2. Create image upload component
3. Implement basic text extraction
4. Add processing status and progress feedback

### Phase 2: Data Extraction (Priority 1)  
1. Parse OCR text into line items
2. Implement manual editing interface
3. Add line item validation
4. Create bill summary calculations

### Phase 3: Bill Splitting (Priority 2)
1. Person management interface
2. Item assignment functionality  
3. Split calculation engine
4. Results display and export

### Phase 4: API Integration (Priority 3)
1. Set up Rust Axum backend structure
2. Implement calculation validation endpoint
3. Add export functionality
4. Error handling and logging

## Key Files to Create

### Frontend Core
```text
frontend/src/
├── components/ocr/
│   ├── ImageUpload.tsx           # File upload with preview
│   ├── OCRProcessor.tsx          # Manages worker processing
│   └── ProcessingStatus.tsx     # Progress and status display
├── components/bill-editor/
│   ├── LineItemEditor.tsx        # Edit extracted items
│   ├── ManualItemAdd.tsx        # Add missed items
│   └── BillSummary.tsx          # Show totals
├── components/bill-splitter/
│   ├── PersonManager.tsx         # Add/edit people
│   ├── ItemAssignment.tsx        # Assign items to people
│   └── SplitCalculator.tsx       # Results display
├── context/
│   ├── BillContext.tsx           # Global state management
│   └── BillReducer.ts            # State update logic
├── workers/
│   └── ocr.worker.ts             # Tesseract processing
└── lib/
    ├── ocr-parser.ts             # Text to line items
    ├── calculations.ts           # Bill splitting math
    └── validation.ts             # Data validation
```

### Backend API
```text
api/src/
├── handlers/
│   ├── bills.rs                  # Bill calculation endpoints
│   └── health.rs                 # Health check
├── models/
│   ├── bill.rs                   # Bill data structures
│   └── validation.rs             # Input validation
├── services/
│   ├── calculator.rs             # Split calculation logic
│   └── validator.rs              # Bill validation
└── lib.rs                        # Main application setup
```

### Shared Types
```text
shared/
├── types/
│   ├── bill.ts                   # Core data types
│   ├── api.ts                    # Request/response types
│   └── ocr.ts                    # OCR-specific types
└── index.ts                      # Type exports
```

## Critical Implementation Details

### OCR Web Worker Setup
```typescript
// frontend/src/workers/ocr.worker.ts
import { createWorker } from 'tesseract.js';

self.onmessage = async (event) => {
  const { imageFile, options } = event.data;
  
  const worker = await createWorker({
    logger: (m) => {
      console.log('OCR Debug:', m); // Debug logging as requested
      self.postMessage({ 
        type: 'PROGRESS', 
        payload: { status: m.status, progress: m.progress * 100 } 
      });
    }
  });

  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const result = await worker.recognize(imageFile);
    
    self.postMessage({
      type: 'COMPLETE',
      payload: {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR', 
      payload: { error: error.message }
    });
  } finally {
    await worker.terminate();
  }
};
```

### State Management Pattern
```typescript
// frontend/src/context/BillContext.tsx
const initialState: BillSplitterState = {
  receipt: null,
  lineItems: [],
  people: [],
  assignments: [],
  summary: null,
  currentStep: 'upload',
  processing: false,
  errors: [],
  ocrProgress: 0,
  ocrStatus: ''
};

export const BillProvider = ({ children }) => {
  const [state, dispatch] = useReducer(billReducer, initialState);
  
  // Auto-save to session storage
  useEffect(() => {
    sessionStorage.setItem('bill-splitter-state', JSON.stringify(state));
  }, [state]);

  return (
    <BillContext.Provider value={{ state, dispatch }}>
      {children}
    </BillContext.Provider>
  );
};
```

### Decimal Arithmetic Helper
```typescript
// frontend/src/lib/calculations.ts
import { Decimal } from 'decimal.js';

export const calculateSplit = (
  lineItems: LineItem[],
  assignments: ItemAssignment[],
  taxRate: string,
  tipAmount: string
): PersonTotal[] => {
  // All calculations use Decimal.js for precision
  const subtotal = lineItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.totalPrice)), 
    new Decimal(0)
  );
  
  const tax = subtotal.times(new Decimal(taxRate));
  const tip = new Decimal(tipAmount);
  
  // Calculate per-person totals...
  return personTotals;
};
```

### Rust API Handler Example
```rust
// api/src/handlers/bills.rs
use axum::{Json, response::Json as JsonResponse};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Deserialize)]
pub struct BillCalculationRequest {
    pub line_items: Vec<LineItem>,
    pub assignments: Vec<ItemAssignment>,
    pub tax_rate: Decimal,
    pub tip_amount: Decimal,
}

pub async fn calculate_bill(
    Json(req): Json<BillCalculationRequest>
) -> Result<JsonResponse<BillCalculationResponse>, BillError> {
    // Validate input
    validate_calculation_request(&req)?;
    
    // Perform calculations with decimal precision
    let summary = calculate_bill_summary(&req)?;
    let person_totals = calculate_person_totals(&req)?;
    
    Ok(Json(BillCalculationResponse {
        summary,
        person_totals,
        calculations: CalculationDetails {
            timestamp: chrono::Utc::now(),
        }
    }))
}
```

## Development Workflow

### 1. Setup Development Environment
```bash
# Frontend setup
cd frontend
pnpm install
pnpm dev

# Backend setup  
cd api
cargo run

# Types setup
cd shared
pnpm install
pnpm build
```

### 2. Testing Strategy
- **Unit Tests**: Components with React Testing Library
- **Integration**: OCR worker with test images
- **E2E**: Full user flow with Playwright
- **API Tests**: Rust Cargo test for calculations

### 3. Performance Monitoring
- Bundle size tracking with `@next/bundle-analyzer`
- OCR processing time measurement
- Core Web Vitals monitoring
- Memory usage tracking for long sessions

## Configuration

### Next.js Configuration
```typescript
// frontend/next.config.js
const nextConfig = {
  webpack: (config) => {
    // Web worker support
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' }
    });
    return config;
  },
  experimental: {
    appDir: true,
  }
};
```

### Tailwind Configuration  
```javascript
// frontend/tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bill-primary': '#2563eb',
        'bill-secondary': '#64748b',
        'person-colors': {
          1: '#FF5733',
          2: '#33FF57',
          // ... more person colors
        }
      }
    }
  },
  plugins: []
};
```

## Security Considerations

- **Client-side only**: No receipt images sent to server
- **Input validation**: All user inputs sanitized  
- **Decimal precision**: Prevent floating-point money errors
- **Session isolation**: No cross-session data leakage
- **File size limits**: Prevent large file uploads (10MB max)

## Deployment Notes

- **Frontend**: Static deployment (Vercel, Netlify)
- **Backend**: Container deployment with PostgreSQL
- **Environment variables**: API URLs, database connections
- **CORS**: Configure for frontend domain
- **Monitoring**: Error tracking and performance metrics

This implementation provides a complete, production-ready OCR bill splitter with proper architecture, type safety, and performance optimization.