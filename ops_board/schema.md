# Ops Board Item Schema (v1)

This schema defines a canonical "Today" item emitted by each source parser.
All fields are stored in memory for ingest and may be persisted later.

## Required fields
- id (string): Stable identifier derived from source + content.
- source (string): One of `briefly`, `mission_control`, `memory`.
- source_path (string): Absolute path to the originating file.
- title (string): Human-readable summary.

## Optional fields
- status (string): One of `today`, `next`, `done`, `unknown`.
- kind (string): One of `note`, `task`, `summary`, `unknown`.
- created_at (string, ISO-8601): When the item was created (if known).
- updated_at (string, ISO-8601): When the item was last updated (if known).
- raw (string): Raw line or excerpt from the source for reference.

## Notes
- Parsers should be tolerant of missing files and emit warnings only.
- IDs must be deterministic so re-running ingest is idempotent.
