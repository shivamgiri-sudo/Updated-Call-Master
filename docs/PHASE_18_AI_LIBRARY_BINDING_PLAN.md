# Phase 18 - AI Studio and Best Call Library Binding Plan

## Purpose

Move the next two data-ready modules from demo-first pages toward real database-backed production views.

## Modules covered

- AI Studio
- Best Call Library

## AI Studio data status

Ready.

Use existing application/reporting data for:

- prompt version visibility
- audit framework builder
- parameter weight visibility
- model/schema validation status
- AI audit governance metrics
- human review and calibration indicators

## AI Studio source areas

- Prompt version master
- Audit prompt configuration
- Audit framework master
- Audit framework rules
- Audit parameter master
- AI audit result
- AI audit parameter result

## AI Studio production behavior

The API should return live database rows first and demo fallback if the database is unavailable.

Required endpoints:

- `/api/ai-studio/prompts`
- `/api/ai-studio/framework`
- `/api/ai-studio/governance`
- `/api/ai-studio/readiness`

## AI Studio readiness rules

- Do not allow prompt edits without versioning.
- Do not allow unapproved prompt versions in production.
- Track model name, prompt version, schema validation, confidence, review flag and override rate.
- Keep fallback data visible as demo fallback only.

## Best Call Library data status

Ready.

Use existing application/reporting data for:

- curated best calls
- transcript snippets
- quality percentage
- disposition and conversion outcome
- coaching use case
- coaching playlists
- coaching assignment flow

## Best Call Library source areas

- Best call library records
- Coaching content
- Coaching assignment
- TNI coaching action
- Call master
- Call transcript
- AI audit result

## Best Call Library production behavior

The API should return live database rows first and demo fallback if the database is unavailable.

Required endpoints:

- `/api/library/best-calls`
- `/api/library/playlists`
- `/api/library/assignments`
- `/api/library/readiness`

## Best Call Library readiness rules

- Use masked transcripts only in the portal.
- Do not expose raw transcript text unless a privileged backend role explicitly requires it.
- Every best-call item should have a coaching use case.
- Playlist completion should be tracked through coaching assignments.

## Build order

1. Add safe read-only service helpers.
2. Bind AI Studio prompt list.
3. Bind AI Studio framework list.
4. Bind AI Studio governance metrics.
5. Bind Best Call Library cards.
6. Bind coaching playlists.
7. Bind coaching assignments.
8. Update tracker and run build.

## Safety rule

Use source/reporting tables with read-only queries. Write new product state only into approved app-owned tables.
