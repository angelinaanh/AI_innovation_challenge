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

