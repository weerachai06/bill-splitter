# Tasks: OCR Bill Splitter

**Input**: Design documents from `/specs/001-ocr-bill-splitter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Feature Goal**: Build an OCR-powered bill splitter that allows users to scan receipt images, extract itemized data using Google Cloud Vision API with web workers, manually correct OCR results, and split bills among multiple people with automatic tax/tip distribution.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths use monorepo structure: `frontend/`, `api/`, `shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and foundational structure

- [X] T001 Initialize shared types package at shared/src/types/ with bill.ts, api.ts, ocr.ts
- [X] T002 [P] Configure TypeScript build for shared types package in shared/tsconfig.json
- [X] T003 [P] Set up frontend environment configuration for Google Vision API in frontend/.env.example
- [X] T004 [P] Install and configure OCR dependencies (Google Cloud Vision API) in frontend/package.json
- [X] T005 Create Rust API project structure at api/src/ with handlers/, models/, database/ directories
- [X] T006 [P] Configure Cargo.toml with Axum, Diesel, and decimal arithmetic dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core OCR and data processing infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Implement Google Cloud Vision API wrapper in frontend/src/lib/vision-api.ts
- [X] T008 [P] Create OCR web worker foundation in frontend/src/workers/ocr.worker.ts
- [X] T009 [P] Setup React Context and reducer for bill state management in frontend/src/context/BillContext.tsx
- [X] T010 [P] Implement decimal arithmetic utilities for financial calculations in frontend/src/lib/calculations.ts
- [X] T011 [P] Create base React components directory structure at frontend/src/components/
- [X] T012 Setup Rust API server structure with Axum routes in api/src/main.rs

**Checkpoint**: OCR foundation and state management ready - user story implementation can begin

---

## Phase 3: User Story 1 - Scan and Extract Receipt Data (Priority: P1) 🎯 MVP

**Goal**: Users can upload receipt images and get automatic OCR text extraction with visual progress feedback

**Independent Test**: Upload a receipt image, verify OCR processing completes and displays extracted text

### Implementation for User Story 1

- [X] T013 [P] [US1] Create image upload component in frontend/src/components/ocr/ImageUpload.tsx
- [X] T014 [P] [US1] Implement OCR processor component in frontend/src/components/ocr/OCRProcessor.tsx
- [X] T015 [P] [US1] Create Receipt entity type in shared/src/types/bill.ts
- [X] T016 [US1] Integrate Vision API with web worker for image processing in frontend/src/workers/ocr.worker.ts
- [X] T017 [US1] Implement OCR progress reporting and error handling in frontend/src/components/ocr/OCRProcessor.tsx
- [X] T018 [US1] Create raw text display component in frontend/src/components/ocr/RawTextDisplay.tsx
- [X] T019 [US1] Add image preprocessing (resize, format conversion) in frontend/src/lib/vision-api.ts
- [X] T020 [US1] Implement OCR status tracking (processing, completed, error) in frontend/src/context/BillContext.tsx

**Checkpoint**: Receipt image upload and OCR extraction fully functional

---

## Phase 4: User Story 2 - Manual Correction of OCR Results (Priority: P2)

**Goal**: Users can review, edit and correct OCR-extracted data before bill splitting

**Independent Test**: Edit extracted line items and verify changes persist and affect calculations

### Implementation for User Story 2

- [X] T021 [P] [US2] Create LineItem entity type in shared/src/types/bill.ts
- [X] T022 [P] [US2] Implement OCR text parser for line items in frontend/src/lib/ocr-parser.ts
- [X] T023 [P] [US2] Create editable line item component in frontend/src/components/bill/LineItemEditor.tsx
- [X] T024 [US2] Implement line item validation logic in frontend/src/lib/calculations.ts
- [X] T025 [US2] Create manual line item addition interface in frontend/src/components/bill/AddLineItem.tsx
- [X] T026 [US2] Add line item deletion functionality in frontend/src/components/bill/LineItemEditor.tsx
- [X] T027 [US2] Implement automatic subtotal calculation in frontend/src/context/BillContext.tsx
- [X] T028 [US2] Create bill summary display component in frontend/src/components/bill/BillSummary.tsx
- [X] T029 [US2] Add data persistence to session storage in frontend/src/lib/storage.ts

**Checkpoint**: Bill editing and correction interface complete with real-time calculations

---

## Phase 5: User Story 3 - Split Bill Among Multiple People (Priority: P3)

**Goal**: Users can assign items to people and automatically calculate individual amounts owed

**Independent Test**: Assign line items to different people and verify correct split calculations with tax/tip distribution

### Implementation for User Story 3

- [ ] T030 [P] [US3] Create Person and ItemAssignment entities in shared/src/types/bill.ts
- [ ] T031 [P] [US3] Implement person management interface in frontend/src/components/split/PersonManager.tsx
- [ ] T032 [P] [US3] Create item assignment interface in frontend/src/components/split/ItemAssignments.tsx
- [ ] T033 [US3] Implement proportional tax/tip distribution logic in frontend/src/lib/calculations.ts
- [ ] T034 [US3] Create split calculation engine in frontend/src/context/BillReducer.ts
- [ ] T035 [US3] Implement shared item splitting interface in frontend/src/components/split/SharedItems.tsx
- [ ] T036 [US3] Create individual split results display in frontend/src/components/split/SplitResults.tsx
- [ ] T037 [US3] Add color coding for person identification in frontend/src/components/split/PersonManager.tsx
- [ ] T038 [US3] Implement split validation (100% assignment check) in frontend/src/lib/calculations.ts
- [ ] T039 [US3] Create bill export functionality in frontend/src/components/split/ExportBill.tsx

**Checkpoint**: Complete bill splitting functionality with visual person assignments

---

## Phase 6: API Integration (Optional - Backend Support)

**Goal**: Rust API backend for calculation validation and potential future features

**Independent Test**: API validates frontend calculations and returns consistent results

### Implementation for API Support

- [ ] T040 [P] Create Rust decimal models in api/src/models/bill.rs
- [ ] T041 [P] Implement calculation validation endpoint in api/src/handlers/calculations.rs
- [ ] T042 [P] Create API contract types in shared/src/types/api.ts
- [ ] T043 Setup database schema for future persistence in api/migrations/
- [ ] T044 [P] Add CORS and request validation middleware in api/src/main.rs
- [ ] T045 [P] Implement error handling and logging in api/src/handlers/error.rs
- [ ] T046 Create API client in frontend/src/lib/api-client.ts
- [ ] T047 Add API integration to calculation functions in frontend/src/lib/calculations.ts

**Checkpoint**: Backend API ready for calculation validation and future enhancements

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Production readiness with error handling, loading states, and user experience polish

### Implementation for Production Readiness

- [ ] T048 [P] Add comprehensive error boundaries in frontend/src/components/ErrorBoundary.tsx
- [ ] T049 [P] Implement loading states for all async operations
- [ ] T050 [P] Add responsive design for mobile/tablet in all components
- [ ] T051 [P] Create comprehensive user onboarding/help text
- [ ] T052 [P] Implement accessibility (ARIA labels, keyboard navigation)
- [ ] T053 [P] Add data validation and sanitization throughout application
- [ ] T054 [P] Optimize bundle size and implement code splitting
- [ ] T055 Performance testing and optimization for OCR processing
- [ ] T056 [P] Add analytics/telemetry for feature usage tracking

**Final Checkpoint**: Production-ready OCR Bill Splitter application

---

## Dependencies

### Story Completion Order
```
Setup (T001-T006) → Foundational (T007-T012) → 
US1: OCR Extraction (T013-T020) → 
US2: Manual Editing (T021-T029) → 
US3: Bill Splitting (T030-T039) → 
API Support (T040-T047) →
Polish (T048-T056)
```

### Parallel Execution Opportunities

**Phase 1-2**: T002, T003, T004, T006, T009, T010, T011 can run in parallel
**Phase 3**: T013, T014, T015, T018 can run in parallel  
**Phase 4**: T021, T022, T023, T025 can run in parallel
**Phase 5**: T030, T031, T032, T037 can run in parallel
**Phase 6**: T040, T041, T042, T044, T045 can run in parallel
**Phase 7**: T048, T049, T050, T051, T052, T053, T054, T056 can run in parallel

---

## Implementation Strategy

### MVP Scope (Recommended Start)
- **Phase 1-3**: Complete User Story 1 for basic OCR functionality
- Delivers immediate value: receipt scanning and text extraction
- Independent and testable increment
- Foundation for subsequent features

### Incremental Delivery Plan
1. **Week 1**: OCR Foundation (US1) - Basic receipt scanning
2. **Week 2**: Data Editing (US2) - Manual correction interface  
3. **Week 3**: Bill Splitting (US3) - Complete splitting functionality
4. **Week 4**: Polish & Testing - Production readiness

### Success Metrics
- **Performance**: OCR processing <10s, API responses <200ms
- **Accuracy**: 80% successful text extraction from typical receipts
- **Usability**: 90% completion rate for full bill splitting flow
- **Quality**: Zero calculation errors in financial arithmetic

- [ ] T009 Create BillContext and state management in frontend/src/context/BillContext.tsx
- [ ] T010 Implement BillReducer with actions in frontend/src/context/BillReducer.ts
- [ ] T011 [P] Set up decimal calculation utilities in frontend/src/lib/calculations.ts
- [ ] T012 [P] Create validation helpers in frontend/src/lib/validation.ts
- [ ] T013 [P] Set up session storage persistence in frontend/src/lib/storage.ts
- [ ] T014 [P] Create error handling utilities in frontend/src/lib/errors.ts

## Phase 3: User Story 1 - Scan and Extract Receipt Data (Priority P1)

**Story Goal**: Users can upload receipt images and extract text using OCR technology  
**Independent Test**: Upload a receipt image and verify text extraction works correctly  

### Implementation Tasks

- [ ] T015 [P] [US1] Create OCR web worker in frontend/src/workers/ocr.worker.ts  
- [ ] T016 [P] [US1] Build ImageUpload component in frontend/src/components/ocr/ImageUpload.tsx
- [ ] T017 [US1] Create OCRProcessor component in frontend/src/components/ocr/OCRProcessor.tsx  
- [ ] T018 [P] [US1] Build ProcessingStatus component in frontend/src/components/ocr/ProcessingStatus.tsx
- [ ] T019 [US1] Implement OCR text parser in frontend/src/lib/ocr-parser.ts
- [ ] T020 [US1] Create main OCR page in frontend/src/app/page.tsx
- [ ] T021 [P] [US1] Add image preprocessing utilities in frontend/src/lib/image-utils.ts
- [ ] T022 [P] [US1] Create Receipt entity types in shared/types/bill.ts

### User Story 1 Tests
- [ ] T023 [P] [US1] Test ImageUpload component with React Testing Library  
- [ ] T024 [P] [US1] Test OCR worker with synthetic receipt images
- [ ] T025 [P] [US1] Test text extraction accuracy with sample receipts

## Phase 4: User Story 2 - Manual Correction of OCR Results (Priority P2)

**Story Goal**: Users can review and edit OCR-extracted data to correct errors  
**Independent Test**: Edit extracted text fields and verify changes persist correctly

### Implementation Tasks

- [ ] T026 [P] [US2] Create LineItemEditor component in frontend/src/components/bill-editor/LineItemEditor.tsx
- [ ] T027 [P] [US2] Build ManualItemAdd component in frontend/src/components/bill-editor/ManualItemAdd.tsx  
- [ ] T028 [P] [US2] Create BillSummary component in frontend/src/components/bill-editor/BillSummary.tsx
- [ ] T029 [US2] Implement line item validation in frontend/src/lib/item-validation.ts
- [ ] T030 [US2] Add edit mode state management to BillReducer
- [ ] T031 [US2] Create edit page in frontend/src/app/edit/page.tsx
- [ ] T032 [P] [US2] Build ItemRow component for individual editing in frontend/src/components/bill-editor/ItemRow.tsx

### User Story 2 Tests  
- [ ] T033 [P] [US2] Test LineItemEditor functionality with RTL
- [ ] T034 [P] [US2] Test manual item addition and validation
- [ ] T035 [P] [US2] Test bill calculation updates on edits

## Phase 5: User Story 3 - Split Bill Among Multiple People (Priority P3)

**Story Goal**: Users can assign items to people and calculate split amounts with tax/tip distribution  
**Independent Test**: Assign items to people and verify calculations are mathematically correct

### Implementation Tasks

- [ ] T036 [P] [US3] Create PersonManager component in frontend/src/components/bill-splitter/PersonManager.tsx
- [ ] T037 [P] [US3] Build ItemAssignment component in frontend/src/components/bill-splitter/ItemAssignment.tsx
- [ ] T038 [P] [US3] Create SplitCalculator component in frontend/src/components/bill-splitter/SplitCalculator.tsx  
- [ ] T039 [US3] Implement bill splitting calculations in frontend/src/lib/split-calculations.ts
- [ ] T040 [US3] Add person and assignment state to BillReducer
- [ ] T041 [US3] Create split page in frontend/src/app/split/page.tsx
- [ ] T042 [P] [US3] Build PersonCard component in frontend/src/components/bill-splitter/PersonCard.tsx
- [ ] T043 [P] [US3] Create results display in frontend/src/components/bill-splitter/Results.tsx

### User Story 3 Tests
- [ ] T044 [P] [US3] Test person management functionality  
- [ ] T045 [P] [US3] Test item assignment logic
- [ ] T046 [P] [US3] Test split calculation accuracy with edge cases

## Phase 6: API Integration (Backend Services)

**Purpose**: Server-side validation and export functionality

- [ ] T047 [P] Set up Axum server structure in api/src/main.rs
- [ ] T048 [P] Create bill calculation handler in api/src/handlers/bills.rs  
- [ ] T049 [P] Implement validation service in api/src/services/validator.rs
- [ ] T050 [P] Create export functionality in api/src/services/exporter.rs
- [ ] T051 [P] Add Rust decimal types in api/src/models/bill.rs
- [ ] T052 [P] Set up database schema in api/migrations/
- [ ] T053 Create API integration in frontend/src/lib/api-client.ts
- [ ] T054 [P] Add export functionality to frontend components

### API Tests
- [ ] T055 [P] Test bill validation endpoint with Cargo test
- [ ] T056 [P] Test calculation accuracy in Rust backend  
- [ ] T057 [P] Test export generation functionality

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final optimizations and production readiness

- [ ] T058 [P] Add error boundaries in frontend/src/components/ErrorBoundary.tsx
- [ ] T059 [P] Implement loading states across all components
- [ ] T060 [P] Add responsive design optimization for mobile
- [ ] T061 [P] Optimize bundle size with code splitting  
- [ ] T062 [P] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T063 [P] Set up performance monitoring and analytics
- [ ] T064 [P] Add comprehensive error logging
- [ ] T065 [P] Create user documentation and help text

### Integration Tests
- [ ] T066 [P] End-to-end test with Playwright (upload → edit → split)
- [ ] T067 [P] Performance testing for OCR processing time
- [ ] T068 [P] Cross-browser compatibility testing

## Dependencies

### Story Dependencies
- **US2** depends on **US1** (needs extracted data to edit)
- **US3** depends on **US2** (needs clean data for accurate splitting)
- **API Integration** can run parallel to US3 (validation is optional)

### Critical Path
1. Setup & Foundation (T001-T014) 
2. User Story 1: OCR (T015-T025)
3. User Story 2: Editing (T026-T035)  
4. User Story 3: Splitting (T036-T046)
5. Polish & Integration (T047-T068)

## Parallel Execution Examples

### Phase 3 (US1) Parallel Groups:
- **Group A**: T015 (OCR worker), T016 (ImageUpload), T018 (ProcessingStatus)
- **Group B**: T021 (image utils), T022 (types), T023-T025 (tests)
- **Sequential**: T017 (OCRProcessor), T019 (parser), T020 (main page)

### Phase 4 (US2) Parallel Groups:  
- **Group A**: T026 (LineItemEditor), T027 (ManualItemAdd), T028 (BillSummary)
- **Group B**: T032 (ItemRow), T033-T035 (tests)
- **Sequential**: T029 (validation), T030 (state), T031 (page)

### Phase 5 (US3) Parallel Groups:
- **Group A**: T036 (PersonManager), T037 (ItemAssignment), T038 (SplitCalculator)  
- **Group B**: T042 (PersonCard), T043 (Results), T044-T046 (tests)
- **Sequential**: T039 (calculations), T040 (state), T041 (page)

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
Focus on **User Story 1 only** for initial release:
- Basic image upload and OCR text extraction
- Simple display of extracted text
- Manual editing capability (minimal)
- Core value: digitize receipts quickly

### Incremental Delivery
1. **MVP**: US1 (OCR extraction) - delivers immediate value
2. **V1.1**: US1 + US2 (editing) - ensures data accuracy  
3. **V1.2**: US1 + US2 + US3 (splitting) - complete feature set
4. **V2.0**: API integration and advanced features

### Success Criteria per Story
- **US1 Success**: 80% OCR accuracy on typical receipts, <10s processing time
- **US2 Success**: Users can correct 100% of OCR errors, changes persist
- **US3 Success**: Mathematical accuracy in splits, proportional tax/tip distribution