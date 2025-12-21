# System Design (MVP)

## Architecture Overview
- Frontend: React (Vite) + Chakra UI (Next.js viable later)
- API: FastAPI (Python)
- DB: PostgreSQL (Supabase hosted) — SQLite used in dev
- Object Storage: S3/Supabase Storage for raw uploads + exports
- Vector Store: Pinecone / Weaviate / Milvus / Supabase pgvector (adapter pattern)
- OCR/Text: Tesseract + PyPDF2 for MVP; Azure Form Recognizer later
- Workers: Celery/RQ for background ingestion jobs
- Auth: JWT (access+refresh later), RBAC enforcement
- Billing: Razorpay (IN), Stripe (intl) via webhooks
- Observability: App Insights/OTel, logs + metrics

## Services & Responsibilities
- Gateway/API: auth, rate limits, tenancy guardrails, request validation, security headers
- Ingestion Service: upload → OCR → parse → chunk → embed → index; status tracking
- Query Service: retrieval, re-rank (optional), context assembly, LLM call, post-process
- Analytics Service: dashboard aggregations, usage metrics, admin assistant (structured)
- Audit Service: append-only logs for critical actions
- Billing Service: plan entitlements, webhooks, usage caps

## Data Model (High Level)
- Tenancy: firm → clients → matters → folders → documents → chunks → embeddings
- Users: users, roles, memberships (user_firm)
- Intelligence: clauses, risks, facts, summaries, chat (sessions/messages)
- Ops: audit_logs, usage_metrics, billing_subscriptions, payments

## Ingestion Flow
1) Upload → store original; record document row (status=uploaded)
2) Parse & OCR → text; per-page metadata
3) Chunking (token-aware) with overlap; attach doc/page/position metadata
4) Embeddings → upsert to vector DB (namespace=firm or matter)
5) Extract clauses, risk, summary, facts → persist
6) Mark status=ready; create search index stats

## Retrieval-Augmented Generation (RAG)
- Question → embed → top-k vector search within matter scope
- Optional re-ranking
- Assemble context under token budget; include citations (doc/page)
- System + user + safety prompts; stream response (optional)
- Store chat session + messages + costs

## Security & Tenancy
- All queries scoped by `firm_id` (and optionally `matter_id`)
- Signed URLs for preview/download
- Encryption at rest (storage, DB), TLS in transit
- Strict RBAC checks per endpoint and resource

## Deployment
- Containers: API + worker
- Environments: dev/staging/prod
- CI/CD: GitHub Actions; migrations on deploy
- Infra (MVP): App Service + managed DB + storage; AKS later if needed

## Failure Modes & Mitigations
- LLM failures: fallback prompts; user-facing safe errors
- OCR failures: queue for paralegal review
- Vector outage: degrade to keyword search (optional)
- Billing errors: grace period with alerts

## Trade-offs
- Start with pgvector or Pinecone: choose based on ops simplicity; adapter abstracts implementation
- SQLite for local dev; Postgres for prod
