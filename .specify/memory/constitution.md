# Bill Splitter Constitution

## Core Principles

### I. Monorepo Structure
The application follows a clear monorepo architecture with separated concerns:
- `/frontend` contains the Next.js application with TypeScript
- `/api` contains the Rust backend with Axum web framework  
- `/shared` contains common TypeScript types and interfaces
Each module maintains independent build processes while sharing type definitions.

### II. Type Safety First  
TypeScript MUST be used throughout the frontend with strict configuration.
Rust MUST be used for the backend API with comprehensive type definitions.
Shared types MUST be defined in the `/shared` directory for contract consistency.

### III. Financial Data Integrity (NON-NEGOTIABLE)
All monetary calculations MUST use decimal arithmetic to avoid floating-point errors.
Database operations involving money MUST be wrapped in transactions.
Currency handling MUST be explicit and validated at API boundaries.

### IV. Clean Architecture
API endpoints MUST follow RESTful conventions with proper HTTP status codes.
Database models MUST be separated from API handlers through service layers.
Frontend components MUST be modular and reusable across different views.

### V. Code Quality Standards (NON-NEGOTIABLE)
All code MUST pass ESLint and Prettier formatting with zero warnings.
TypeScript strict mode MUST be enabled with no `any` types in production code.
Code complexity MUST be measured and kept under defined thresholds (max cyclomatic complexity: 10).
All public functions and components MUST have comprehensive JSDoc documentation.
Code reviews MUST be completed by at least one other developer before merge.
Dead code MUST be removed - no commented-out code blocks in production branches.

### VI. Testing Standards (NON-NEGOTIABLE)
Unit tests MUST cover all business logic for bill calculations with 90%+ coverage.
Integration tests MUST verify API endpoints and database operations.
Frontend components MUST have tests for user interaction flows and accessibility.
E2E tests MUST cover critical user journeys (create bill, add expenses, split amounts).
All tests MUST be deterministic - no flaky tests allowed in CI/CD pipeline.
Test data MUST use factories/builders pattern for maintainability.
Performance tests MUST validate response times and resource usage under load.

### VII. User Experience Consistency (NON-NEGOTIABLE)
All interactive elements MUST follow established design system patterns.
Loading states MUST be displayed for operations taking >200ms.
Error messages MUST be user-friendly with clear action steps.
UI components MUST be accessible (WCAG 2.1 AA compliance minimum).
Mobile responsiveness MUST be tested on devices from 320px to 1440px width.
User feedback MUST be provided within 100ms of interaction (visual confirmation).
Navigation patterns MUST be consistent across all pages and workflows.

### VIII. Performance Requirements (NON-NEGOTIABLE)
Frontend bundle size MUST stay under 500KB gzipped for initial page load.
API response times MUST be under 200ms for 95th percentile requests.
Database queries MUST be optimized with proper indexing (no N+1 queries).
Images MUST be optimized with next/image and appropriate sizing/formats.
Core Web Vitals MUST meet Google's "Good" thresholds (LCP <2.5s, FID <100ms, CLS <0.1).
Memory usage MUST be monitored with no memory leaks in long-running sessions.
Bundle analysis MUST be performed on every release to prevent bloat.

## Technology Stack

### Frontend Stack
- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript latest with strict mode
- **Styling**: Tailwind CSS with design system tokens
- **Testing**: Jest + React Testing Library + Playwright for E2E
- **Linting**: Biome Biome rules
- **Bundle Analysis**: @next/bundle-analyzer for size monitoring

### Backend Stack  
- **Language**: latest
- **Web Framework**: Axum with tower middleware
- **Database**: PostgreSQL 15+ with Diesel ORM
- **Testing**: Cargo test + criterion for benchmarks
- **Serialization**: Serde with strict deserialization
- **Monitoring**: Tracing and metrics collection

### Development Tools
- **Containerization**: Docker for consistent environments
- **Package Management**: pnpm for frontend, Cargo for Rust  
- **Version Control**: Git with conventional commit messages
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Code Quality**: Husky pre-commit hooks with lint-staged
- **Documentation**: Storybook for component documentation
- **Performance Monitoring**: Lighthouse CI + Core Web Vitals tracking

## Project Structure Requirements

```
bill-splitter/
├── frontend/           # Next.js application
│   ├── src/app/       # App Router pages and layouts
│   ├── src/components/# Reusable React components  
│   └── package.json   # Frontend dependencies
├── api/               # Rust backend
│   ├── src/           # Source code
│   └── Cargo.toml     # Rust dependencies
├── shared/            # Common TypeScript definitions
│   ├── types/         # Type definitions
│   └── index.ts       # Exported types
└── docker-compose.yml # Development environment
```

## Quality Gates & Governance

### Pre-Commit Requirements
Code changes MUST pass all linting, formatting, and type checking.
Unit tests MUST pass with 90%+ coverage for new code.
Bundle size analysis MUST show no significant increases without justification.
Accessibility tests MUST pass for all new UI components.

### Pre-Merge Requirements  
All CI/CD checks MUST pass including integration and E2E tests.
Performance regression tests MUST show no degradation >10%.
Code review MUST be completed with approval from domain expert.
Documentation MUST be updated for public API changes.

### Pre-Release Requirements
Full test suite MUST pass including performance benchmarks.
Security audit MUST be completed for dependency changes.
Core Web Vitals MUST meet "Good" thresholds in staging environment.
Database migrations MUST be tested with rollback procedures.

### Monitoring & Maintenance
Performance metrics MUST be tracked and reviewed monthly.
Dependency updates MUST be applied within 30 days of release.
Technical debt MUST be addressed - max 5% of sprint capacity.
User feedback MUST be reviewed and prioritized weekly.

### Constitutional Amendments
Financial calculation logic MUST be reviewed by two developers.
Database schema changes MUST include reversible migrations.
Breaking changes MUST follow semantic versioning with migration guides.
Security-related changes MUST be approved by security champion.

This constitution ensures reliable bill splitting functionality through strict 
type safety, proper financial handling, and maintainable architecture.

**Version**: 2.0.0 | **Ratified**: 2025-12-20 | **Last Amended**: 2025-12-20
