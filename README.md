# Bill Splitter

A full-stack application template with Rust API backend and Next.js frontend.

## Project Structure

```
.
├── api/                                    # Rust API backend
│   ├── Cargo.lock
│   ├── Cargo.toml                         # Dependencies and project config
│   └── src/
│       └── main.rs                        # Main application entry point
├── bill-splitter.code-workspace           # VS Code workspace config
├── frontend/                              # Next.js frontend application
│   ├── biome.json                         # Biome linter/formatter config
│   ├── components.json                    # shadcn/ui components config
│   ├── next-env.d.ts
│   ├── next.config.ts                     # Next.js configuration
│   ├── package.json                       # Dependencies and scripts
│   ├── postcss.config.mjs                 # PostCSS configuration
│   ├── public/                            # Static assets
│   │   ├── favicon.ico
│   │   ├── *.svg                          # Icon assets
│   │   ├── icon-*.png                     # PWA icons
│   │   └── sw.js                          # Service worker for PWA
│   ├── PWA-README.md                      # PWA setup documentation
│   ├── README.md                          # Frontend-specific documentation
│   ├── src/
│   │   ├── app/                           # Next.js app directory
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css                # Global styles
│   │   │   ├── layout.tsx                 # Root layout component
│   │   │   ├── manifest.ts                # PWA manifest
│   │   │   └── page.tsx                   # Home page
│   │   ├── components/
│   │   │   ├── BillSplitter.tsx           # Main bill splitter component
│   │   │   ├── PWAComponents.tsx          # PWA-related components
│   │   │   └── ui/                        # Reusable UI components (shadcn/ui)
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── form.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       └── textarea.tsx
│   │   └── lib/
│   │       ├── mockData.ts                # Mock data for development
│   │       └── utils.ts                   # Utility functions
│   └── tsconfig.json                      # TypeScript configuration
└── README.md                              # Project documentation
```

## Getting Started

### Backend (Rust API)

```bash
cd api
cargo run
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Features

- **Backend**: Basic Rust application template
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **UI Components**: Basic reusable components (Button, Card, Input)

## Development

- Backend runs on `http://localhost:8080` (when configured)
- Frontend runs on `http://localhost:3000`

## Tech Stack

### Backend
- Rust
- Cargo for package management

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
