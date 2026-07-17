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
