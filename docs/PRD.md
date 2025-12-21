# Product Requirements Document (PRD) — MVP v1.0

## 1. Product Vision
India-first legal AI workspace for solo lawyers, small firms, and enterprise teams. Enables AI-assisted document review, clause analytics, and client/matter-centric chat with dashboards and strict tenant isolation.

## 2. In-Scope (MVP)
- Multi-tenant workspaces (firm → clients → matters → folders → documents)
- Upload (PDF/DOCX/Images), OCR, text extraction, chunking, embeddings, vector search
- AI features: summaries, clause extraction, risk tagging, suggested rewrite, key facts, PDF summary export
- Matter-centric RAG chat with citations; Hindi/English responses
- Role dashboards: Admin, Lawyer, Paralegal
- Audit logs, encryption at rest, disclaimers, delete workflow
- Demo mode: 1 doc, 5 Q limit, auto-delete in 30 min

## 3. Out of Scope (MVP)
Word add-in, workflow playbooks, due-diligence tables, on-prem, client portal, doc comparison, SSO, advanced compliance engine, external API integrations.

## 4. Users & Roles
- Firm Admin: owns workspace; full dashboard; manage users, billing, usage, templates
- Lawyer/Associate: matters, reviews, high-risk items; personal usage dashboard
- Paralegal/Analyst: uploads, OCR issues, metadata tasks
- Demo User: anonymous, no dashboard, session-limited

## 5. Key User Journeys
- Admin: create firm, invite users, view firm analytics and usage
- Lawyer: open matter → see required reviews → chat with citations → export summary
- Paralegal: upload documents → fix failed OCR → complete metadata tasks
- Demo: upload one file → get summary + clauses + ask 5 Qs → CTA to signup

## 6. Features & Acceptance Criteria
A. Core Platform
- Create firm, clients, matters, folders; role-based access
- Upload with status tracking; secure storage; delete wipes data+vectors
- AC: Only tenant users access their resources; delete is irreversible and wipes vectors

B. Document Intelligence
- Summary (3–8 bullets), clause extraction (India-focused), risk tagging (R/Y/G), simple rewrite, key facts
- AC: Include sources and confidence; export PDF summary; process typical 10–50 page contracts

C. AI Chat (Matter)
- RAG over matter docs; citations; Hindi/English toggle; rate limiting; save history
- AC: If unsupported, answer "I don’t know" with sources

D. Dashboards
- Admin: clients, matters, docs, high-risk, uploads/week, users & activity, pending ingestions, AI usage tokens/day
- Lawyer: active matters, docs requiring review, high-risk clauses, progress, last 10 docs, personal usage
- Paralegal: upload queue, failed OCR, missing metadata, assigned tasks, pending summaries
- AC: Widgets load under 2s for 1k docs baseline; data restricted by role

E. Firm-level Assistant
- Admin-only Q&A over structured metadata (no raw doc text)
- AC: Returns traceable, token-efficient analytics with sources

F. Templates
- NDA, Rent, Offer, Vendor; edit and generate new docs
- AC: Versioned templates with audit trail

G. Audit & Security
- Logs: upload, view, AI usage; encryption at rest; signed preview URLs; tenant isolation; delete
- AC: All access logged with actor, resource, timestamp

H. Billing
- Plans: Solo, Small, Growing, Enterprise; Razorpay (IN), Stripe (intl)
- AC: Webhooks recorded; access entitlements updated on payment state

I. Demo Mode
- 1 doc; 5 questions; no saving; auto-delete in 30 min; CTA after limit
- AC: Anonymous session; rate limits; privacy banner

## 7. Non-Functional Requirements
- Performance: P50 < 1.5s API (non-AI); P90 < 3s dashboards; P95 < 12s AI answer
- Availability: 99.5% MVP; graceful degradation on AI errors
- Security: TLS, JWT, per-tenant isolation; secrets in vault
- Observability: request latency, vector queries, LLM tokens/cost, error rates, feedback

## 8. Metrics
- Demo: completion rate, Qs per session, conversion to signup
- Product: MAU, docs uploaded, clauses flagged, time-to-answer, helpfulness, churn
- Cost: tokens per user/day, per-document processing cost

## 9. Dependencies
- FastAPI, PostgreSQL (target), storage (S3/Supabase), vector DB, OpenAI/Azure OpenAI, OCR (Tesseract/Form Recognizer), React/Chakra, Razorpay/Stripe

## 10. Release Plan
- Sprint 1–2: DB schema, ingestion POC, RAG baseline, demo flow end-to-end
- Sprint 3–4: Dashboards MVP, admin assistant (structured), audit logs, billing hooks
- Sprint 5: Hardening, QA, launch checklist, observability dashboard
