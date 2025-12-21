# API Specification (MVP)

Base URL: {API_BASE_URL}
Auth: Bearer JWT; all requests scoped by firm (except demo)

## Auth
- POST /api/auth/register → { email, password, full_name, role? } → { access_token, user }
- POST /api/auth/login → { email, password } → { access_token, user }
- GET /api/auth/me → { user }

## Firms & Users
- POST /api/firms → { name } → { firm }
- POST /api/firms/{id}/invite → { email, role } → { invite_status }
- GET /api/users → list users in firm (admin)

## Clients & Matters
- POST /api/clients → { name } → { client }
- GET /api/clients → { clients }
- POST /api/matters → { client_id, title, status? } → { matter }
- GET /api/matters → { matters }
- GET /api/matters/{id} → { matter, documents, stats }

## Folders & Documents
- POST /api/folders → { matter_id, name } → { folder }
- POST /api/upload → multipart(file, matter_id?, folder_id?) → { document_id, status }
- GET /api/documents/{id} → { document, clauses, summary, facts }
- DELETE /api/documents/{id} → wipe + vectors → { ok }

## Intelligence
- POST /api/documents/{id}/extract → run pipeline (admin/lawyer) → { status }
- GET /api/documents/{id}/summary → { bullets[] }
- GET /api/documents/{id}/clauses → { clauses[] }
- GET /api/documents/{id}/facts → { facts }
- GET /api/documents/{id}/download-summary → PDF

## Chat (Matter)
- POST /api/chat → { matter_id, question, session_id? } → { answer, citations[], confidence }
- GET /api/chat/{session_id} → { messages[] }

## Dashboards & Analytics
- GET /api/stats → role-aware stats
- GET /api/paralegal-tasks → queues

## Admin Assistant (Structured)
- POST /api/assistant/query → { question, filters? } → { report, sources }

## Templates
- GET /api/templates → firm templates
- POST /api/templates → { name, content } → { template }
- PUT /api/templates/{id} → { content } → { template }

## Audit
- GET /api/audit → filter by resource/user/time

## Billing
- POST /api/billing/webhook/razorpay → signature check → { ok }
- POST /api/billing/webhook/stripe → signature check → { ok }
- GET /api/billing/subscription → { plan, status }

## Health
- GET /api/health → { status, timestamp }

---

## Roles & Access (summary)
- admin: full firm resources; assistant, billing, invites
- lawyer: clients/matters/docs; chat; create matters; limited deletes
- paralegal: upload; fix OCR; metadata; limited views
- demo: upload 1 doc, 5 Qs; no persistence

---

## Mapping to Current Code
- Implemented: /api/auth/*, /api/health, /api/upload, /api/chat, /api/stats, /api/matters(GET,POST), /api/paralegal-tasks
- Missing: /api/firms, /api/clients, /api/folders, /api/templates, /api/audit, /api/billing/*, /api/assistant/query, document detail endpoints
