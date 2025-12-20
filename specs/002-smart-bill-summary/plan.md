# Implementation Plan: Smart Bill Summary with Field Filtering

**Branch**: `002-smart-bill-summary` | **Date**: December 20, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-smart-bill-summary/spec.md`

## Summary

Primary requirement: Build a frontend application that processes receipt images to generate clean bill summaries with intelligent field filtering, removing unnecessary content while preserving essential billing data. Core functionalities: (1) convert OCR text to CSV format, (2) remove unnecessary fields like email addresses and thank you messages, (3) separate items by rows as structured item lists.

## Technical Context

**Language/Version**: TypeScript/Next.js 15+ for frontend, existing Rust API for OCR processing  
**Primary Dependencies**: Next.js App Router, Google Cloud Vision API (existing), CSV generation libraries  
**Storage**: Local storage for user preferences, session storage for temporary data  
**Testing**: Jest + React Testing Library for frontend components, Cypress for E2E receipt processing flows  
**Target Platform**: Web application with responsive design supporting mobile receipt capture  
**Project Type**: Frontend extension of existing monorepo structure  
**Performance Goals**: <10 seconds per receipt processing, real-time CSV preview generation  
**Constraints**: Must leverage existing OCR infrastructure, maintain decimal arithmetic for financial data  
**Scale/Scope**: Single-user receipt processing with potential for batch operations up to 50 receipts

## Constitution Check *(Final Review)*

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Monorepo Architecture**: Building on existing frontend structure with new components
- ✅ **Type Safety First**: TypeScript strict mode, shared types for OCR data structures  
- ✅ **Test-Driven Development**: Unit tests for filtering logic, integration tests for OCR pipeline (required before implementation)
- ✅ **Database Integrity**: Financial calculations use decimal arithmetic (Decimal.js) for precision
- ✅ **API Design Standards**: Leverage existing OCR API endpoints with proper error handling
- ✅ **Performance Requirements**: Client-side processing reduces API load, <10s processing time meets <200ms API requirement
- ✅ **User Experience Consistency**: Reuses existing design patterns, accessible components with WCAG compliance
- ✅ **Bundle Size**: Smart filtering components will be code-split to maintain <500KB initial bundle
- ✅ **Code Quality**: TypeScript strict mode, no 'any' types, comprehensive JSDoc documentation planned
- ✅ **Financial Data Integrity**: All monetary calculations use string-based decimal representation

**Final Verdict**: ✅ ALL CONSTITUTIONAL REQUIREMENTS MET - Ready for implementation

## Project Structure

### Documentation (this feature)

```text
specs/002-smart-bill-summary/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - field classification algorithms
├── data-model.md        # Phase 1 output - filtering rules and CSV structure
├── quickstart.md        # Phase 1 output - user guide for smart filtering
├── contracts/           # Phase 1 output - OCR data types and CSV export contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/src/
├── app/
│   └── smart-summary/   # New smart summary pages
│       ├── page.tsx     # Main upload and processing interface
│       ├── batch/       # Batch processing interface
│       └── settings/    # Filtering preferences
├── components/
│   ├── smart-summary/   # Smart filtering components
│   │   ├── ReceiptUpload.tsx      # Image upload with preview
│   │   ├── FieldFilterEditor.tsx  # Custom filtering rules
│   │   ├── CleanSummaryView.tsx   # Filtered results display
│   │   ├── CSVExportPanel.tsx     # CSV generation and export
│   │   └── BatchProcessor.tsx     # Multiple receipt handling
│   └── ocr/            # Existing OCR components (reused)
├── lib/
│   ├── smart-filtering/ # Core filtering algorithms
│   │   ├── field-classifier.ts   # Essential vs non-essential classification
│   │   ├── content-parser.ts     # Receipt text parsing and categorization
│   │   ├── csv-generator.ts      # Structured CSV output generation
│   │   └── filter-profiles.ts    # User-defined filtering rules
│   └── ocr-service.ts  # Existing OCR integration (enhanced)
└── types/
    └── smart-summary.ts # TypeScript interfaces for filtering data
```

**Structure Decision**: Extends existing OCR infrastructure by adding smart filtering capabilities as a separate app route. Reuses established components while introducing new filtering-specific modules that can operate independently of the bill splitting features.

## User Requirements Mapping

Based on your specific rules:

### Rule 1: Convert text to CSV
- **Component**: `CSVExportPanel.tsx` 
- **Logic**: `csv-generator.ts`
- **Output**: Structured CSV with columns: Item, Quantity, Unit_Price, Total, Category
- **Format**: RFC 4180 compliant with proper escaping for special characters

### Rule 2: Remove unnecessary fields
- **Component**: `FieldFilterEditor.tsx`
- **Logic**: `field-classifier.ts`
- **Targets for removal**: Email addresses, thank you messages, store hours, promotional text, loyalty program details, legal disclaimers
- **Preservation**: Items, quantities, prices, tax, subtotal, total, merchant name (configurable)

### Rule 3: Separate items by rows
- **Component**: `CleanSummaryView.tsx`
- **Logic**: `content-parser.ts`  
- **Output**: Each purchased item becomes a distinct row with parsed quantity, description, and price
- **Handling**: Line item detection across different receipt formats and languages

## Complexity Tracking

> Constitution Check passes - no violations requiring justification

| Consideration | Decision | Rationale |
|---------------|----------|-----------|
| New vs Extend | Extend existing OCR | Leverages proven OCR pipeline, reduces development time |
| Client vs Server | Client-side filtering | Preserves privacy, reduces API complexity, enables real-time preview |
| Storage approach | Session + Local Storage | User preferences persist, temporary data cleared after export |
