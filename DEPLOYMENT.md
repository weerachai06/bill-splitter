# Cloudflare Pages Deployment Guide

## Prerequisites

1. **Cloudflare Account**: สร้าง account ที่ [Cloudflare](https://cloudflare.com)
2. **API Token**: สร้าง API token สำหรับ Pages deployment

## Setup Instructions

### 1. สร้าง Cloudflare API Token

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. คลิก "Create Token"
3. เลือก "Custom token" template
4. ตั้งค่าดังนี้:
   - **Token name**: `Bill Splitter Pages Deploy`
   - **Permissions**:
     - `Cloudflare Pages:Edit`
     - `Account:Read`
   - **Account Resources**: `Include - All accounts`
   - **Zone Resources**: `Include - All zones`

### 2. ตั้งค่า GitHub Secrets

ใน GitHub repository settings → Secrets and variables → Actions:

```
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

### 3. Local Development Commands

```bash
# ติดตั้ง dependencies
cd frontend
pnpm install

# Development server
pnpm dev

# Build และ deploy
pnpm build
pnpm deploy

# Preview locally
pnpm preview
```

### 4. Wrangler Commands

```bash
# Login to Cloudflare
npx wrangler login

# Deploy to production
npx wrangler pages deploy frontend/out --project-name=bill-splitter-frontend

# View deployment
npx wrangler pages deployment list

# View logs
npx wrangler pages logs tail
```

## Deployment Triggers

### Automatic Deployment
- **Production**: Push to `main` branch + changes in `frontend/` folder
- **Preview**: Pull request to `main` branch + changes in `frontend/` folder

### Manual Deployment
- GitHub Actions → "Deploy Frontend to Cloudflare Pages" → "Run workflow"

## Project Structure

```
.
├── .github/workflows/
│   ├── deploy-frontend.yml    # Frontend deployment
│   └── deploy-api.yml        # API deployment
├── frontend/
│   ├── next.config.ts        # Static export config
│   └── package.json          # Wrangler + scripts
└── wrangler.toml            # Cloudflare Pages config
```

## Monitoring

- **Production URL**: `https://bill-splitter-frontend.pages.dev`
- **Preview URLs**: Unique URL สำหรับแต่ละ PR
- **Dashboard**: [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)

## Troubleshooting

### Build Errors
```bash
# Check build locally
cd frontend
pnpm build

# Check output directory
ls -la out/
```

### Deployment Errors
```bash
# Check wrangler version
npx wrangler --version

# Test deployment locally
npx wrangler pages dev out --port 3001
```

### Path Filtering Issues
- GitHub Actions จะ trigger เมื่อมีการเปลี่ยนแปลงใน:
  - `frontend/**` folder
  - `.github/workflows/deploy-frontend.yml`