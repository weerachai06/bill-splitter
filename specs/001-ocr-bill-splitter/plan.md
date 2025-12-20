# Implementation Plan: OCR Bill Splitter

**Branch**: `001-ocr-bill-splitter` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ocr-bill-splitter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an OCR-powered bill splitting application that allows users to upload receipt images, automatically extract itemized data using Google Cloud Vision API, manually correct OCR errors, and split bills among multiple people with proportional tax/tip distribution. Uses monorepo architecture with Next.js frontend, Rust Axum backend, and shared TypeScript types.

## Technical Context

**Language/Version**: TypeScript/Next.js 16+ for frontend, Rust latest with Axum for API  
**Primary Dependencies**: Next.js App Router, Google Cloud Vision API, Axum web framework, Diesel ORM, PostgreSQL, Decimal.js  
**Storage**: PostgreSQL with Diesel ORM for ACID compliance and decimal monetary types  
**Testing**: Jest + React Testing Library for frontend, Cargo test for Rust API  
**Target Platform**: Web application with responsive design (mobile-first)
**Project Type**: monorepo/web with shared TypeScript contracts  
**Performance Goals**: <200ms API response time, <10s OCR processing, type-safe contracts  
**Constraints**: Decimal arithmetic for financial data, ACID transactions, web worker OCR processing  
**Scale/Scope**: Multi-person bill splitting with real-time calculations and session storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Post-Phase 1 Re-evaluation:**

- ✅ Monorepo Architecture: Frontend, API, and shared types in separate directories *(CONFIRMED)*
- ✅ Type Safety First: TypeScript frontend with strict mode, Rust API, OpenAPI contracts *(CONFIRMED)*  
- ✅ Financial Data Integrity: Decimal arithmetic implemented with Decimal.js/rust_decimal, ACID transactions required (NON-NEGOTIABLE) *(CONFIRMED)*
- ✅ Test-Driven Development: Tests required before implementation (NON-NEGOTIABLE) *(CONFIRMED)*
- ✅ API Design Standards: REST conventions, proper error handling, semantic versioning *(CONFIRMED)*
- ✅ Performance Requirements: Bundle size limits, Core Web Vitals monitoring (NON-NEGOTIABLE) *(CONFIRMED)*
- ✅ Code Quality Standards: ESLint/Prettier, TypeScript strict mode, documentation requirements (NON-NEGOTIABLE) *(CONFIRMED)*

**Design Validation:** All constitutional requirements remain satisfied. The research phase established Google Cloud Vision API for OCR (replacing Tesseract.js for better accuracy), decimal arithmetic patterns, and web worker implementation strategy. Data model and contracts maintain financial precision and type safety requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-ocr-bill-splitter/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bill-splitter/
├── frontend/            # Next.js application with App Router
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # Reusable React components
│   │   ├── lib/        # Frontend utilities and OCR processing
│   │   └── workers/    # Web workers for OCR processing
│   └── tests/          # Frontend tests (Jest + React Testing Library)
├── api/                # Rust backend API
│   ├── src/
│   │   ├── handlers/   # API route handlers for receipts and splits
│   │   ├── models/     # Database models with Diesel (Receipt, LineItem, Person)
│   │   ├── database/   # Database connection and migrations
│   │   └── main.rs     # Application entry point
│   └── tests/          # API tests (Cargo test)
├── shared/             # Shared TypeScript types and contracts
│   ├── types/          # API and domain types (Receipt, LineItem, BillSplit)
│   └── index.ts        # Type exports
└── .specify/           # Project specifications and templates
```

**Structure Decision**: Monorepo with clear module boundaries following constitutional 
requirements. Frontend handles OCR processing in web workers, API manages persistence 
and calculations with decimal precision, shared types ensure contract consistency.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No constitutional violations detected. All requirements align with established principles.*
