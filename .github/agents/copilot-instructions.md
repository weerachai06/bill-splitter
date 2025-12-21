# bill-splitter Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-20

## Active Technologies

- TypeScript/Next.js 16+ for frontend, Rust latest with Axum for API + Next.js App Router, Google Cloud Vision API, Axum web framework, Diesel ORM, PostgreSQL, Decimal.js (001-ocr-bill-splitter)
- PostgreSQL with Diesel ORM for ACID compliance and decimal monetary types (001-ocr-bill-splitter)
- TypeScript/Next.js 15+ for frontend, existing Rust API for OCR processing + Next.js App Router, Google Cloud Vision API (existing), CSV generation libraries (002-smart-bill-summary)
- Local storage for user preferences, session storage for temporary data (002-smart-bill-summary)

- TypeScript/Next.js 16+ for frontend, Rust latest for API + Next.js, Tesseract.js, Tailwind CSS, Axum, Diesel, PostgreSQL (001-ocr-bill-splitter)

## Project Structure

- See README.md for detailed project structure and setup instructions.

## Commands

cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style

TypeScript/Next.js 16+ for frontend, Rust latest for API: Follow standard conventions

## Recent Changes

- 002-smart-bill-summary: Added TypeScript/Next.js 15+ for frontend, existing Rust API for OCR processing + Next.js App Router, Google Cloud Vision API (existing), CSV generation libraries
- 001-ocr-bill-splitter: Added TypeScript/Next.js 16+ for frontend, Rust latest with Axum for API + Next.js App Router, Google Cloud Vision API, Axum web framework, Diesel ORM, PostgreSQL, Decimal.js

- 001-ocr-bill-splitter: Added TypeScript/Next.js 16+ for frontend, Rust latest for API + Next.js, Tesseract.js, Tailwind CSS, Axum, Diesel, PostgreSQL

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
