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

Migration `0003_classes_and_subjects.sql` is applied to the configured Supabase project. It adds `subjects`, `classes`, and `class_memberships`; `npm run seed:subjects` has loaded 28 organization-scoped rows from the GDPT 2018 STEAM classification. The backend additionally enforces teacher ownership, organization equality, subject/class grade equality, and student/class grade equality before service-role writes.

The next content distribution migration should add `class_content_assignments` (or an equivalent class-to-Skill-Node relation). `PUBLISHED` is the visibility gate, while the assignment row will define which active class members receive class-specific content.

Migration `0004_grade_levels.sql` is written but **not yet applied** to the configured Supabase project — apply it, then rerun `npm run seed:subjects` to backfill. It adds a `grades` lookup table (1-12) and `subjects.min_grade`/`max_grade`, because `grade_band` alone could not tell "Tự nhiên & Xã hội" (grades 1-3) apart from "Khoa học" (grades 4-5) even though both are `primary`. `seedSubjects.js` now upserts with `ignoreDuplicates: false` so the already-seeded 28 rows get the precise range instead of being skipped. See `docs/databasedesign.md` Phần 7 for the full grade-to-subject table. Follow-up when the Course Studio tables land: `courses.grade` should reference `grades(grade_number)` and be validated against the subject's `min_grade`/`max_grade`, not just `grade_band`.

Migration `0005_class_capacity_and_multi_subject.sql` is written but **not yet applied**. It adds `classes.max_members` (nullable, 1-100) and a `class_subjects` junction table, then **drops `classes.subject_id`** — a class can now hold multiple subjects instead of exactly one. Apply it before deploying the updated `classroomService.js` (it queries `class_subjects` and no longer selects `classes.subject_id`, so backend and schema must move together). Capacity is enforced in the service layer, not by a DB constraint: `assertCapacity()` runs on every membership transition that would become `active` (invite-converges-to-active, approve request, join-converges-to-active, accept invite) and throws `CLASS_FULL` past `max_members`. See `docs/databasedesign.md` Phần 8.

Migration `0006_class_exact_grade.sql` is written but **not yet applied**, and depends on `0004` (`grades`, `subjects.min_grade/max_grade`) being applied first. It adds `classes.grade` (nullable smallint, 1-12, CHECK against `grade_band`) so a teacher picks an exact grade instead of only a band, and `createClass` now validates each selected subject against that exact grade via `min_grade`/`max_grade` rather than only `grade_band` — this closes the gap noted in Phần 7 (a grade-1 class could previously select "Khoa học", which only runs grades 4-5). Existing classes created before this migration keep `grade = null`; only new classes are required to set it (enforced in `classroomService.js`, not the DB, since there is no way to backfill an exact grade from a band alone).

Bug found while `0004`/`0006` were still unapplied: with `subjects.min_grade`/`max_grade` still `null` on the live DB, the original grade filter fell back to "show every subject in the band," so picking grade 1 showed both "Tự nhiên & Xã hội" and "Khoa học" together. Fixed by adding a hardcoded `SUBJECT_GRADE_RANGES` table (`classroomRules.js`, mirrored in `TeacherClassesPage.jsx`) keyed by `(gradeBand, subject name)` from the fixed GDPT 2018 catalog — it is now the primary source for subject-to-grade matching in both `validateClassSubjects` (backend) and the create-class subject picker (frontend), independent of whether `min_grade`/`max_grade` have been backfilled yet. DB columns remain as fallback for any future subject outside this fixed catalog.
