# Tasks: OCR Bill Splitter

**Input**: Design documents from `/specs/001-ocr-bill-splitter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Foundation)

**Purpose**: Initialize project structure and shared dependencies

- [ ] T001 Install Tesseract.js dependencies in frontend/package.json
- [ ] T002 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [ ] T003 [P] Set up Tailwind CSS configuration in frontend/tailwind.config.js
- [ ] T004 [P] Create shared types directory and setup in shared/types/
- [ ] T005 [P] Configure web worker support in frontend/next.config.js
- [ ] T006 [P] Set up Rust Axum project structure in api/src/
- [ ] T007 [P] Add Decimal.js dependency for frontend calculations
- [ ] T008 [P] Configure PostgreSQL with Diesel in api/Cargo.toml

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed by all user stories

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