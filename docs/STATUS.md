# Implementation Coverage (MVP A–G)

Status as of 2025-12-15 (based on current codebase scan).

## Summary
- Implemented (partial): Auth, Upload, Chat, Basic Dashboards (Admin/Lawyer/Paralegal), Health, Stats, Matters, Paralegal Tasks
- Not implemented yet: Multi-tenant firms/clients, Templates, Audit logs, Billing, Assistant analytics queries, Full RBAC, Proper DB schema for A–G

## Backend Endpoints (current)
- Auth: /api/auth/register ✓, /api/auth/login ✓, /api/auth/me ✓
- Health: /api/health ✓
- Documents: /api/upload ✓, /api/chat ✓
- Dashboards: /api/stats ✓, /api/matters (GET, POST) ✓, /api/paralegal-tasks ✓
- Missing: /api/firms, /api/clients, /api/folders, /api/templates, /api/audit, /api/billing/*, /api/assistant/*

## Frontend
- Pages: Admin, Lawyer, Paralegal, Login, Landing ✓
- Demo: Upload + chat via DemoSection ✓ (limited logic)
- Missing: Clients/Matters/Folders management UI, Templates UI, Admin-only assistant UI, Billing UI

## Data Layer
- Current: SQLite file with basic tables ✓
- Missing: Multi-tenant schema (firms, clients, matters, folders), clause metadata, audit logs, usage metrics, billing models, embeddings store linkage

## A–G Document Status
- PRD (A): To be added in docs/PRD.md
- System Design (B): To be added in docs/SystemDesign.md
- DB Schema (C): To be added in docs/DB_SCHEMA.md + DB_SCHEMA.sql
- API Spec (D): To be added in docs/API_SPEC.md
- Prompt Library (E): To be added in docs/Prompts.md
- Dashboard Requirements (F): To be added in docs/DashboardRequirements.md
- Demo Constraints (G): To be added in docs/DemoConstraints.md
- RBAC Matrix: To be added in docs/RBAC_Matrix.md

## Immediate Implementation Priorities
1) Finalize DB schema (tenancy, docs, clauses, audit, usage) → migrations
2) API spec + route stubs for firms/clients/matters/folders/templates/audit/billing/assistant
3) Prompt library for summary/clauses/risk/RAG/admin analytics
4) Frontend additions: management UIs and admin assistant panel
5) Security/RBAC enforcement across endpoints

See each doc for detailed acceptance criteria and tasks.