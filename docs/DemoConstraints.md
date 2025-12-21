# Demo Constraints (MVP)

## Limits
- One document per session
- 5 chat questions max
- No dashboard, no persistence
- Auto-delete file, vectors, and logs after 30 minutes

## Behavior
- Anonymous session id cookie/localStorage
- Rate limiting per IP/session
- Privacy banner visible; explicit disclaimer
- CTA to signup after 5th question and at export

## Session Lifecycle
- Created at upload
- Destroyed at timeout or user clears
- All data purge job runs every 5 minutes

## Telemetry
- Demo starts, upload success/failure, Q&A events, completion/conversion
- Latency, errors, LLM token costs

## Acceptance Criteria
- End-to-end flow operates reliably with typical PDF contract
- Sources shown; “I don’t know” on unsupported queries
- No data retained beyond 30 minutes
