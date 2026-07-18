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

Migration `0003_classes_and_subjects.sql` adds `subjects`, `classes`, and `class_memberships`. Migration `0004_grade_level_subject_catalog.sql` adds exact `grade_level` (1-12) to profiles, subjects, and classes; backfills legacy band data; normalizes subject names; loads 101 rows per organization; and adds grade/band database constraints. The backend additionally enforces teacher ownership, organization equality, exact subject/class grade equality, and exact student/class grade equality before service-role writes.

The next content distribution migration should add `class_content_assignments` (or an equivalent class-to-Skill-Node relation). `PUBLISHED` is the visibility gate, while the assignment row will define which active class members receive class-specific content.

Migration `0005_class_capacity_and_multi_subject.sql` adds `classes.max_members` (nullable, 1-100) and a `class_subjects` junction table, then drops legacy `classes.subject_id`. The junction carries `grade_level` and has composite foreign keys to both `classes(id, grade_level)` and `subjects(id, grade_level)`, so a class can hold multiple subjects but only for its exact grade. Capacity is enforced in the service layer: `assertCapacity()` runs on every membership transition that would become `active` and throws `CLASS_FULL` past `max_members`.

Migrations `0004` and `0005` are intentionally rerunnable after a failed/partial manual SQL attempt. They check whether legacy `classes.subject_id` still exists before reading it, and they realign existing `class_subjects` rows to the canonical grade-specific subject rows before adding composite constraints.

Some live databases may still have legacy `subjects.min_grade` / `subjects.max_grade` columns from the older grade-range migration. Migration `0004` keeps those columns compatible by filling both values with the exact `grade_level` for every grade-specific catalog row, avoiding NOT NULL failures during manual reruns.

Migration `0006_class_exact_grade.sql` is now a reconciliation migration. It preserves canonical `classes.grade_level`, backfills it from an older `classes.grade` column if that column exists, drops the obsolete column, and reasserts grade/band checks. This keeps the merged schema on one source of truth: `grade_level`.
