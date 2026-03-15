# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SterilGuard Pro is a sterilization management system for beauty salons, compliant with Polish Sanepid (sanitary inspection) regulations. It tracks sterilization processes through a 6-step wizard and generates PDF audit reports.

## Commands

### Backend (`backend/`)
```bash
npm install                        # install dependencies
npx prisma generate                # regenerate Prisma client after schema changes
npx prisma migrate dev --name X    # create and apply a migration
node_modules/.bin/tsc --noEmit     # type-check without building
node_modules/.bin/tsc              # compile to dist/
node dist/index.js                 # run compiled server (port 3000)
npm run dev                        # run with ts-node-dev (hot reload)
```

### Frontend (`frontend/`)
```bash
npm install --legacy-peer-deps     # required due to react-scripts@5 peer dep conflicts
npm install ajv@^8 --legacy-peer-deps  # required fix for Node.js v24 + react-scripts
node_modules/.bin/react-scripts build  # compile to build/ (served by backend)
npm start                          # dev server (has issues with Node.js v24)
```

### Adding users directly to DB (no admin UI yet)
```bash
cd backend
node -e "
const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();
prisma.user.create({ data: { firstName: '...', lastName: '...', email: '...', role: 'STYLIST' } })
  .then(u => { console.log(u); prisma.\$disconnect(); });
"
```

## Architecture

### Stack
- **Backend**: Node.js + Express + Prisma ORM + SQLite (file: `backend/prisma/steril_guard.db`)
- **Frontend**: React + TypeScript (CRA), served as static files from the backend at port 3000
- **No auth**: system currently has no authentication layer

### Key architectural decisions

**SQLite instead of PostgreSQL** — schema was originally designed for PostgreSQL (with native `Json` and `enum` types). After migration to SQLite, all `Json` fields are stored as `String` (JSON-serialized), and all `enum` types are `String`. Always use `JSON.stringify()` when writing `physicalParameters` to the DB and `JSON.parse()` when reading it back.

**Frontend served by backend** — `frontend/build/` is copied to `backend/frontend/build/` and served as static files by Express (`express.static`). The `__dirname` of the compiled backend is `dist/`, so Express resolves the path as `backend/frontend/build/`.

**Process status machine** — sterilization processes advance through a strict one-way state machine defined in `sterilization.routes.ts`:
```
DRAFT → INITIAL_DISINFECTING → PREPARING → PACKAGING → STERILIZING → VERIFYING → COMPLETED → SEALED
```
Once `SEALED`, no edits are allowed. The sealed process gets a SHA-256 hash stored in `sealHash` for tamper detection.

### Backend structure
- `src/config/constants.ts` — all domain constants and TypeScript enums (`ProcessStatus`, `RiskCategory`, `TestResult`, etc.). Enums have string values matching the DB strings.
- `src/routes/` — Express routers: `sterilization.routes.ts` (main), `user.routes.ts`, `report.routes.ts`
- `src/utils/auditTrail.ts` — `sealProcess()`, `canEditProcess()`, SHA-256 hash generation
- `src/utils/reportGenerator.ts` — PDF generation with `pdf-lib` for Sanepid-compliant reports
- `src/utils/serialNumber.ts` — generates serial numbers in format `SG-YYYYMMDD-XXXX`
- `src/services/riskAssessor.ts` — Spaulding classification logic (HIGH/MEDIUM/LOW risk)

### Frontend structure
- `src/api/client.ts` — all API calls via axios, hardcoded baseURL `http://localhost:3000/api`
- `src/components/SterilizationWizard.tsx` — 6-step process wizard (main user flow)
- `src/components/Dashboard.tsx` — summary stats
- `src/components/ProcessList.tsx` — history view
- `src/types/index.ts` — frontend TypeScript types (separate from backend types)

### Sanepid compliance rules (domain logic)
- Sterilization temperature must be ≥ 134°C (constant `MIN_STERILIZATION_TEMP`)
- Tool packages are valid for 6 months after sterilization (`PACKAGE_VALIDITY_MONTHS`)
- Documentation must be archived for 10 years (`ARCHIVE_YEARS`)
- HIGH and MEDIUM risk tools (Spaulding classification) require autoclave sterilization at 134°C
- LOW risk tools require only high-level disinfection
