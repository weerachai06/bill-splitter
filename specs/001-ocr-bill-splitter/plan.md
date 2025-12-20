# Implementation Plan: OCR Bill Splitter

**Branch**: `001-ocr-bill-splitter` | **Date**: December 20, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ocr-bill-splitter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an OCR-powered bill splitter that allows users to scan receipt images, extract itemized data using Tesseract.js with web workers, manually correct OCR results, and split bills among multiple people with automatic tax/tip distribution. Frontend uses Next.js with Tailwind CSS, backend uses Rust Axum with PostgreSQL.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript/Next.js 16+ for frontend, Rust latest for API  
**Primary Dependencies**: Next.js, Tesseract.js, Tailwind CSS, Axum, Diesel, PostgreSQL  
**Storage**: PostgreSQL with Diesel ORM for ACID compliance and bill data persistence  
**Testing**: Jest + React Testing Library for frontend, Cargo test for Rust API  
**Target Platform**: Web application with responsive design (320px-1440px)  
**Project Type**: Full-stack monorepo with OCR image processing capabilities  
**Performance Goals**: <10s OCR processing, <200ms API responses, <500KB bundle size  
**Constraints**: Decimal arithmetic for financial data, web worker for OCR, console.log debugging  
**Scale/Scope**: Single-session bill splitting with image upload and manual editing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Monorepo Architecture: Frontend, API, and shared types in separate directories
- ✅ Type Safety First: TypeScript frontend, Rust API, OpenAPI contracts
- ✅ Test-Driven Development: Tests required before implementation (NON-NEGOTIABLE)
- ✅ Database Integrity: Decimal arithmetic, reversible migrations, ACID properties
- ✅ API Design Standards: REST conventions, proper error handling, semantic versioning

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   └── lib/        # Frontend utilities
│   └── tests/          # Frontend tests (Jest + React Testing Library)
├── api/                # Rust backend API
│   ├── src/
│   │   ├── handlers/   # API route handlers
│   │   ├── models/     # Database models with Diesel
│   │   ├── database/   # Database connection and migrations
│   │   └── main.rs     # Application entry point
│   └── tests/          # API tests (Cargo test)
├── shared/             # Shared TypeScript types and contracts
│   ├── types/          # API and domain types
│   └── index.ts        # Type exports
└── .specify/           # Project specifications and templates
```

**Structure Decision**: Monorepo with clear module boundaries following constitutional 
requirements. Frontend and API maintain independent builds while sharing type definitions
through the shared directory for type safety across the application boundary.

## Post-Design Constitution Check ✅

*Re-evaluation after Phase 1 design completion*

- ✅ **Monorepo Architecture**: Frontend (Next.js), API (Rust), shared types clearly separated
- ✅ **Type Safety First**: Complete TypeScript contracts, Rust with Serde, shared type definitions
- ✅ **Financial Data Integrity**: Decimal.js for frontend, rust_decimal for backend, string-based API contracts
- ✅ **Clean Architecture**: REST API design, service layer separation, modular React components  
- ✅ **Code Quality Standards**: ESLint/Prettier setup, TypeScript strict mode, comprehensive JSDoc
- ✅ **Testing Standards**: Jest + RTL for frontend, Cargo test for Rust, E2E with Playwright
- ✅ **User Experience Consistency**: Tailwind design system, loading states, error handling
- ✅ **Performance Requirements**: Bundle splitting, OCR web worker, <200ms API responses

**Final Assessment**: ✅ APPROVED - All constitutional requirements met in design

## Complexity Tracking

No constitutional violations identified. Design adheres to all core principles and standards.
