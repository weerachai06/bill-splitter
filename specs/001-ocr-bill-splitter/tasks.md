# Tasks: OCR Bill Splitter

**Input**: Design documents from `/specs/001-ocr-bill-splitter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are omitted per template guidance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 Create shared TypeScript types in shared/src/types/bill.ts
- [X] T002 Create shared TypeScript types in shared/src/types/ocr.ts
- [X] T003 [P] Configure Decimal.js for frontend financial calculations in frontend/src/lib/calculations.ts
- [ ] T004 [P] Setup web worker structure in frontend/src/workers/ocr.worker.ts
- [X] T005 [P] Install and configure Google Cloud Vision API dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Setup React Context for bill state in frontend/src/context/BillContext.tsx
- [X] T007 Create bill reducer with state transitions in frontend/src/context/BillReducer.ts
- [X] T008 [P] Implement session storage persistence in frontend/src/lib/storage.ts
- [X] T009 [P] Create OCR processing utilities with Google Cloud Vision in frontend/src/lib/vision-api.ts
- [ ] T010 [P] Setup error handling and logging infrastructure in frontend/src/lib/error-handling.ts
- [ ] T011 [P] Configure image preprocessing utilities in frontend/src/lib/image-utils.ts
- [ ] T012 Create base UI components in frontend/src/components/ui/Button.tsx and related components

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scan and Extract Receipt Data (Priority: P1) 🎯 MVP

**Goal**: Users can upload receipt images and automatically extract itemized data using OCR technology

**Independent Test**: Upload a receipt image and verify text is extracted and displayed correctly with line items and prices

### Implementation for User Story 1

- [X] T013 [P] [US1] Create Receipt model interface in shared/src/types/bill.ts
- [X] T014 [P] [US1] Create LineItem model interface in shared/src/types/bill.ts
- [X] T015 [P] [US1] Create image upload component in frontend/src/components/ocr/ImageUpload.tsx
- [X] T016 [P] [US1] Create OCR progress indicator in frontend/src/components/ocr/ProcessingStatus.tsx
- [ ] T017 [US1] Implement OCR text extraction service in frontend/src/lib/ocr-service.ts
- [X] T018 [US1] Create OCR text parser with quantity patterns in frontend/src/lib/ocr-parser.ts
- [X] T019 [US1] Create raw text display component in frontend/src/components/ocr/RawTextDisplay.tsx
- [ ] T020 [US1] Create extracted items display in frontend/src/components/bill/ExtractedItems.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Manual Correction of OCR Results (Priority: P2)

**Goal**: Users can review and edit OCR-extracted data to correct errors and add missing items

**Independent Test**: Edit extracted text fields and add new line items, verify changes are saved and calculations update

### Implementation for User Story 2

- [X] T021 [P] [US2] Create line item editor component in frontend/src/components/bill/LineItemEditor.tsx
- [X] T022 [P] [US2] Create add new item component in frontend/src/components/bill/AddLineItem.tsx
- [ ] T023 [P] [US2] Implement validation utilities for line items in frontend/src/lib/validation.ts
- [ ] T024 [US2] Create edit mode toggle and UI states in frontend/src/components/bill/EditableItemList.tsx
- [X] T025 [US2] Implement bill summary calculations in frontend/src/components/bill/BillSummary.tsx
- [ ] T026 [US2] Add tax and tip input components in frontend/src/components/bill/TaxTipInputs.tsx
- [X] T027 [US2] Create save/restore functionality for manual edits in frontend/src/lib/storage.ts
- [ ] T028 [US2] Add data validation and error display in frontend/src/components/bill/ValidationErrors.tsx
- [X] T029 [US2] Integrate editing with OCR results preservation in frontend/src/context/BillReducer.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Split Bill Among Multiple People (Priority: P3)

**Goal**: Users can assign items to people and calculate proportional amounts owed including tax/tip

**Independent Test**: Assign items to people and verify calculations are correct with proper tax/tip distribution

### Implementation for User Story 3

- [X] T030 [P] [US3] Create Person model interface in shared/src/types/bill.ts
- [X] T031 [P] [US3] Create ItemAssignment model interface in shared/src/types/bill.ts
- [X] T032 [P] [US3] Create person management component in frontend/src/components/split/PersonManager.tsx
- [ ] T033 [P] [US3] Create item assignment interface in frontend/src/components/split/ItemAssignment.tsx
- [ ] T034 [US3] Implement proportional calculation engine in frontend/src/lib/split-calculations.ts
- [ ] T035 [US3] Create split results display in frontend/src/components/split/SplitResults.tsx
- [ ] T036 [US3] Add shared item splitting logic in frontend/src/components/split/SharedItemSplitter.tsx
- [ ] T037 [US3] Implement tax and tip distribution in frontend/src/lib/calculations.ts
- [ ] T038 [US3] Create person summary cards in frontend/src/components/split/PersonSummary.tsx
- [ ] T039 [US3] Add export functionality for split results in frontend/src/components/split/ExportOptions.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Add responsive design improvements in frontend/src/styles/
- [ ] T041 [P] Implement error boundaries in frontend/src/components/ErrorBoundary.tsx
- [ ] T042 [P] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T043 [P] Performance optimization for large receipts and many people
- [ ] T044 [P] Add loading states and animations in frontend/src/components/ui/
- [ ] T045 [P] Create help and onboarding content in frontend/src/components/help/
- [ ] T046 Code cleanup and remove console.log statements
- [ ] T047 Add comprehensive TypeScript documentation
- [ ] T048 Run quickstart.md validation and update if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses data from US1/US2 but independently testable

### Within Each User Story

- Models before components that use them
- Core services before UI components
- Base components before specialized features
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- UI components marked [P] can run in parallel if they don't share the same files

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Receipt model interface in shared/src/types/bill.ts"
Task: "Create LineItem model interface in shared/src/types/bill.ts"
Task: "Create image upload component in frontend/src/components/ocr/ImageUpload.tsx"
Task: "Create OCR progress indicator in frontend/src/components/ocr/OCRProgress.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T013-T020)
4. **STOP and VALIDATE**: Test User Story 1 independently - upload receipt, verify extraction
5. Deploy/demo if ready - delivers core OCR value proposition

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (adds editing capability)
4. Add User Story 3 → Test independently → Deploy/Demo (completes full bill splitting)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (OCR extraction)
   - Developer B: User Story 2 (manual editing)
   - Developer C: User Story 3 (bill splitting)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Financial calculations use Decimal.js for constitutional compliance
- OCR processing runs in web workers to avoid UI blocking
- All monetary values stored as decimal strings per shared type definitions
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently