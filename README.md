# Bill Splitter

A modern bill splitting application built with Next.js and Rust.

## Architecture

This is a monorepo containing:
- **frontend/**: Next.js 14+ application with TypeScript and Tailwind CSS
- **api/**: Rust backend with Axum and Diesel
- **shared/**: Common types and contracts

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Rust 1.75+ and Cargo
- PostgreSQL 14+
- Docker (optional)

### Development

1. **Database Setup**
   ```bash
   # Start PostgreSQL (Docker)
   docker run -d --name bill-splitter-db \
     -e POSTGRES_DB=bill_splitter \
     -e POSTGRES_USER=dev \
     -e POSTGRES_PASSWORD=dev_password \
     -p 5432:5432 postgres:14
   ```

2. **Backend Setup**
   ```bash
   cd api
   # Copy environment template
   cp .env.example .env
   # Install dependencies and run migrations
   cargo build
   diesel migration run
   # Start development server
   cargo run
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Project Structure

```
bill-splitter/
├── frontend/          # Next.js application
├── api/              # Rust backend API
├── shared/           # Common types and contracts
├── docs/             # Documentation
└── .specify/         # Project specifications and templates
```

## Development Principles

This project follows strict development principles documented in [.specify/memory/constitution.md](.specify/memory/constitution.md), including:

- **Monorepo Architecture**: Clear module boundaries with shared contracts
- **Type Safety First**: TypeScript frontend, Rust backend, OpenAPI contracts
- **Test-Driven Development**: Tests before implementation (NON-NEGOTIABLE)
- **Database Integrity**: Decimal arithmetic for financial calculations
- **API Design Standards**: RESTful conventions with proper error handling

## Contributing

1. Read the [Constitution](.specify/memory/constitution.md) for development principles
2. All pull requests require tests and must pass quality gates
3. Financial calculation logic requires two-reviewer approval
4. Database changes must include reversible migrations