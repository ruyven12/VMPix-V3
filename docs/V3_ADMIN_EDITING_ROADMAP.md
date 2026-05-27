# V3 Admin Editing Roadmap

This document defines the planned path from Sheets-driven ingestion to safe DB-backed admin editing for VMPix-V3 and VMPix-Data. It is documentation only. It does not build DB editing UI, change backend code, alter schemas, wire APIs, or touch V2.

## Core Rule

The editing system comes after shell/module stabilization. V3 must first have stable shell behavior, route behavior, module boundaries, mobile/webview safety, loading states, empty states, error states, and backend diagnostics.

## Non-Negotiable Safety Rules

- No destructive edits.
- Admin authentication is required before any edit tools exist.
- Audit trail is required later before meaningful edits are trusted.
- Soft delete is preferred over hard delete.
- Imports must not overwrite manual DB edits without explicit approval.
- Backend diagnostics come first.
- Editing comes after shell/module stabilization.
- V2 and live systems remain donor/reference only.

## Phase 1 - Sheets Remain Ingestion Source

Status: current/planned starting point.

Sheets remain the ingestion source for operational data while V3 frontend modules stabilize.

Goals:

- Keep existing Sheets workflows intact.
- Import records into backend staging or DB tables without changing the editorial workflow.
- Preserve source row metadata on imported records.
- Identify missing IDs, duplicate records, missing venues, orphan relationships, and inconsistent counts.
- Keep V3 frontend static-first and tolerant of missing API data.

Required safeguards:

- Imports are append/update controlled by stable IDs.
- Every imported record keeps source metadata such as sheet name, row ID, import batch, and import timestamp.
- Import diagnostics flag conflicts instead of silently rewriting trusted records.
- No admin edit UI is built in this phase.

Exit criteria:

- Stable ID strategy is documented and consistently applied.
- Venue matching uses `venue_id` as the planned source of truth.
- Backend diagnostics can report missing venues, orphan relationships, count mismatches, and duplicate candidates.

## Phase 2 - Admin Reads DB Records

Status: future.

The admin shell reads DB records but does not edit them yet.

Goals:

- Display DB-backed records in protected admin views.
- Add diagnostic views for imports, record health, relationship gaps, and count mismatches.
- Compare imported values, derived values, and frontend display readiness.
- Validate API response shapes before edit forms exist.

Required safeguards:

- Admin auth must exist before DB-backed admin data is exposed.
- Read views must clearly separate imported source values from derived DB fields.
- Diagnostics should show manual edit conflicts, even before editing is enabled.
- Frontend public modules must not depend on admin views to render.

Exit criteria:

- Admin can inspect records, relationships, import batches, and diagnostics.
- API read contracts are stable enough for module integration.
- Missing/empty/error states are proven in admin and public module surfaces.

## Phase 3 - Admin Edit Forms For Safe Fields

Status: future, after diagnostics and auth.

Admin editing begins with safe, low-risk fields only.

Candidate safe fields:

- Display title/name overrides.
- Descriptions and notes.
- Status flags.
- Visibility flags.
- Curated thumbnail/media selection.
- Alias fields.
- Manual relationship review fields that are explicitly approved.

Fields to avoid at first:

- Primary stable IDs.
- Raw import source IDs.
- Destructive deletes.
- Bulk relationship rewrites.
- Automated winner/stat rewrites without diagnostics.
- Venue merges without review.

Required safeguards:

- Admin auth required.
- Field-level validation required.
- Soft delete or archive flags instead of hard delete.
- Audit trail records who changed what, when, and why.
- Manual edit flags protect changed fields from blind import overwrite.
- Import jobs must require approval before replacing manually edited DB values.

Exit criteria:

- Safe edit forms are tested against validation, audit logging, rollback expectations, and import conflict behavior.
- Public modules can consume edited DB values without breaking static-first fallback expectations.

## Phase 4 - DB Becomes Primary Source Of Truth

Status: future.

The DB becomes the primary source of truth for records, relationships, display fields, and admin-reviewed corrections.

Goals:

- Public V3 modules read from backend APIs backed by DB records.
- Admin edits update DB records, not Sheets.
- Imports become controlled sync jobs instead of authoritative overwrites.
- Relationship fields, counts, and venue references are validated from DB state.

Required safeguards:

- Manual DB edits win over imports unless an admin approves replacement.
- Diagnostics must show stale imports, skipped import fields, and conflicts.
- Stable IDs cannot be changed casually.
- Venue identity and merge workflows require review.
- Audit trail is retained and searchable.

Exit criteria:

- V3 frontend modules can rely on DB/API records for production data.
- Admin can safely review and resolve import conflicts.
- Sheets are no longer required for the live display source of truth.

## Phase 5 - Sheets Become Optional Backup/Export

Status: future.

Sheets become optional backup, reporting, or export surfaces.

Goals:

- Export DB records back to Sheets when useful.
- Keep Sheets available for human review, backups, and external workflows.
- Prevent Sheets from silently overriding DB-owned manual edits.
- Use DB diagnostics as the trusted health layer.

Required safeguards:

- Exports are clearly marked as exports, not primary source records.
- Re-importing exported Sheets requires conflict checks.
- Manual DB edits remain protected.
- Soft-deleted records remain recoverable according to retention rules.

Exit criteria:

- Sheets can be removed from the critical path without breaking V3 public modules or admin operations.
- Backup/export workflows are documented and reversible.

## Import Conflict Rules

Imports must not overwrite manual DB edits without approval.

Minimum conflict metadata:

```json
{
  "record_id": "music-show-2008-06-28-culling-the-herd",
  "record_type": "music_show",
  "field": "venue_id",
  "imported_value": "unknown-venue",
  "current_db_value": "the-underground-charlotte-nc",
  "manual_edit": true,
  "resolution_required": true,
  "resolution": null
}
```

Required conflict behavior:

- Preserve current DB value by default.
- Log the attempted import change.
- Surface the conflict in diagnostics.
- Require explicit admin approval to replace a manually edited field.
- Keep enough source metadata to trace the conflict back to the import batch and source row.

## Audit Trail Requirements

Audit trail is required later before meaningful editing is trusted.

Minimum audit event shape:

```json
{
  "audit_id": "audit-000001",
  "actor_admin_id": "admin-user-id",
  "action": "update_field",
  "record_type": "music_show",
  "record_id": "music-show-2008-06-28-culling-the-herd",
  "field": "venue_id",
  "previous_value": "unknown-venue",
  "next_value": "the-underground-charlotte-nc",
  "reason": "Resolved venue diagnostic warning.",
  "created_at": "2026-05-27T00:00:00Z"
}
```

Audit expectations:

- Record actor, action, record type, record ID, changed field, previous value, next value, reason, and timestamp.
- Keep audit records append-only.
- Do not allow audit records to be edited through normal admin forms.
- Make audit history visible before broad editing is enabled.

## Soft Delete Expectations

Soft delete is preferred over hard delete.

Planned fields:

```json
{
  "deleted_at": null,
  "deleted_by": null,
  "delete_reason": null,
  "visibility": "public"
}
```

Rules:

- Use `visibility` or `deleted_at` to hide records without destroying them.
- Keep relationships inspectable after soft delete.
- Diagnostics should flag records pointing to soft-deleted dependencies.
- Hard delete requires a separate explicit policy and approval.

## Backend Diagnostics First

Before edit forms exist, backend diagnostics should answer:

- Which records lack stable IDs?
- Which shows lack `venue_id`?
- Which venue names are duplicates or alias candidates?
- Which people are referenced by tags but missing person records?
- Which match winners do not resolve to participants?
- Which `show_count` values disagree with linked records?
- Which imports attempted to overwrite manual DB edits?
- Which records are orphaned from their expected parent entities?

## Do Not Build Yet

Do not build the following until explicitly approved:

- DB editing UI.
- Backend mutation endpoints.
- Schema changes.
- Auth bypasses or temporary unsecured admin edit tools.
- Hard delete workflows.
- Bulk import overwrite tools.
- V2 migration edits.
