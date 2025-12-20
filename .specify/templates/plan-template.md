# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [TypeScript/Next.js latest for frontend, Rust latest for API]  
**Primary Dependencies**: [Next.js, Axum, Diesel, PostgreSQL]  
**Storage**: [PostgreSQL with Diesel ORM for ACID compliance]  
**Testing**: [Jest + React Testing Library for frontend, Cargo test for Rust API]  
**Target Platform**: [Web application with responsive design]
**Project Type**: [monorepo/web - determines source structure]  
**Performance Goals**: [<200ms API response time, type-safe contracts]  
**Constraints**: [Decimal arithmetic for financial data, ACID transactions]  
**Scale/Scope**: [Multi-user bill splitting with real-time updates]

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

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
