# Database Module

## Purpose

Supabase schema, migrations, seeds, RLS policy notes, and database hardening scripts.

## Inputs

- Migration SQL.
- Seed data for demo.
- Schema changes from product implementation.

## Outputs

- Versioned database changes.
- Demo-ready seed data.
- RLS and safety enforcement.

## Dependencies

- Supabase Postgres.
- `pgcrypto`.
- `pgvector`.

## Limitations

- Service role access must stay on backend/deployment only.
- Schema changes require docs updates.
- RAG retrieval must be published-only before real pilot use.

## Demo Data

The current schema is already provisioned in Supabase. No migration is required for Slice 1. Use `backend/scripts/seedDemo.js` through `npm run seed:demo` to populate the existing tables with an idempotent seven-node Scratch learning path and demo users.

Slice 2 still requires no schema migration. `npm run reset:demo` resets only Loops quiz progress for the known demo student so the end-to-end lesson can be presented repeatedly.

Slice 3 also uses existing tables without a migration: `source_documents`, `document_chunks`, `tutor_sessions`, `tutor_messages`, `tutor_escalations`, `ai_usage`, and `daily_cost_budgets`. The demo seed adds approved Loops source rows; `seed:tutor` adds vectors only after external-transfer approval.

The authentication slice also uses the existing schema. Supabase Auth owns sessions; `profiles` owns application role/grade; `guardian_consent_at` records consent; and initial student projections are inserted by the backend after verified onboarding. Trusted onboarding fields that do not yet exist as profile columns (`date_of_birth`, `guardian_email`, `account_status`) are stored in service-written Auth app metadata. Before pilot, add a versioned migration and RLS policies for the complete guardian workflow instead of changing the live schema ad hoc.
