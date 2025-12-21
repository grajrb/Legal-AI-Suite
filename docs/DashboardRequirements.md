# Dashboard Requirements (MVP)

## Admin Dashboard
Widgets:
- Firm Overview: clients, matters, documents (counts)
- High-Risk Documents: count and trend
- Uploads per Week: line chart
- Users & Activity: active users, actions
- Pending Ingestions: queue size
- AI Usage: tokens/day, cost/day
Data Sources: matters, documents, clauses (risk), usage_metrics, audit_logs
Performance: < 2s P90 for 1k docs

## Lawyer Dashboard
Widgets:
- Active Matters: list with status and deadlines
- Documents Requiring Review: by risk/highlight
- High-Risk Clauses Assigned: count and list
- Matter Progress: completion indicators
- Recent Documents: last 10
- Personal AI Usage: tokens/day
Data Sources: matters (assigned_to), clauses, documents, usage_metrics

## Paralegal Dashboard
Widgets:
- Upload Queue: processing status
- Failed OCR: list with retry action
- Missing Metadata: tasks
- Assigned Tasks: checklist
- Pending Summaries: to generate
Data Sources: documents(status), audit_logs, system queues

## Metrics Formulas (examples)
- Uploads/Week = COUNT(documents WHERE created_at in last 7 days)
- High-Risk Documents = COUNT(DISTINCT document_id FROM clauses WHERE risk='red')
- Tokens/Day = SUM(usage_metrics.tokens_used GROUP BY date)

## Access Control
- Admin: all firm data
- Lawyer: assigned matters, created matters
- Paralegal: upload queues, metadata tasks
