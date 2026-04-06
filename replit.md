# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### SAJU Sales Calculator (`artifacts/saju-calculator`)
- **Type**: React + Vite (frontend only, no backend needed)
- **Preview path**: `/`
- **Port**: 19996
- **Purpose**: Guided step-by-step web app for healthcare coverage sales reps. Lets vendors calculate prices, suggest plans, and manage documentation checklists in real time with clients.
- **Architecture**:
  - All data driven from `src/data/saju-config.json` (plans, pricing tables, documents, FAQ)
  - Business logic in `src/lib/calculator.ts` (price lookup, plan suggestion, capacity calculation)
  - State managed via React Context in `src/context/CalculatorContext.tsx`
  - 7-step guided flow: ClientType → Age → EconomicData → Plan → Family → Documentation → Summary
  - Quick FAQ tab for common seller questions

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Preview path**: `/api`
- **Port**: 8080

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
