# Database Schema (MVP)

Target: PostgreSQL (with pgvector). Provide SQLite-compatible variants for dev.

## Entities
- firms (tenant root)
- users, roles, user_firm (membership/role)
- clients (by firm)
- matters (by client)
- folders (by matter)
- documents (by matter)
- document_versions (optional MVP+)
- chunks (by document)
- embeddings (vector ref per chunk; may live in vector DB)
- clauses (by document or chunk)
- clause_risks (R/Y/G)
- summaries (by document)
- facts (by document)
- chat_sessions (by matter, user, demo flag)
- chat_messages
- audit_logs (append-only)
- usage_metrics (per user/firm/day)
- templates (by firm)
- billing_subscriptions, payments (basic)

## Keys & Constraints
- All core tables carry `firm_id` for isolation
- FKs: clients(firm_id) → firms, matters(client_id), folders(matter_id), documents(matter_id), chunks(document_id), clauses(document_id), etc.
- Indexes: (firm_id), (matter_id), (client_id), time-based on logs/usage

## Postgres DDL
See DB_SCHEMA.sql for full CREATE TABLE statements, indexes, and constraints, including pgvector setup.

## SQLite Dev Variant
- Omit vector column; store vector_id ref only
- Keep identical names/columns where possible to simplify app code

## Migration Plan
1. Create new schema alongside existing SQLite
2. Backfill: map existing users and docs into new schema (default firm)
3. Switch app to Postgres via env config
4. Run dual-write (optional) until confidence, then sunset SQLite

## Data Retention & Deletion
- Soft-delete with `deleted_at` for reversible actions; hard delete for demo data and on user request (wipes vectors)
- Audit logs are append-only (no delete) except for compliance

## Indices & Performance
- Dashboard queries: composite indexes on (firm_id, created_at)
- Chat queries: (matter_id, created_at)
- Embedding search: via vector DB; maintain backref table for joins
