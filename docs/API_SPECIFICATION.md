# API_SPECIFICATION.md

**Project:** Abhimanyu (BharatForensic AI)
**API version:** v1
**Base URL (local):** `http://localhost:8000/api/v1`
**Base URL (demo):** `https://<your-render-or-railway-host>/api/v1`
**Framework:** FastAPI (OpenAPI docs auto-served at `/docs` and `/openapi.json`)
**Last updated:** 2026-11-24

> The API serves the Flutter mobile app and the Next.js analyst portal. Long-running forensic analysis is **asynchronous**: the client submits a job, receives a `job_id`, and then polls, subscribes via WebSocket, or waits for a push notification. See `ARCHITECTTURE.md` section 7.

---

## 1. Conventions

### 1.1 Protocol and format
- HTTPS only in non-local environments.
- Request and response bodies are JSON (`Content-Type: application/json`), except PDF/file endpoints.
- Field names use `snake_case`.
- Timestamps are ISO 8601 in UTC, e.g. `2026-11-24T10:58:00Z`.
- Money values are numbers in INR with a `unit` field when ambiguity is possible (`INR`, `INR_LAKH`, `INR_CRORE`).
- IDs are UUID strings; companies are also addressable by `ticker` (NSE symbol) or `isin`.

### 1.2 Authentication
- `Authorization: Bearer <access_token>` (JWT) on all endpoints except those marked **Public**.
- Access token lifetime: 30 minutes. Refresh token lifetime: 30 days.
- Roles: `investor`, `analyst`, `admin`. Required role is listed per endpoint.

### 1.3 Standard headers
| Header | Direction | Purpose |
|---|---|---|
| `Authorization` | request | JWT bearer token |
| `Idempotency-Key` | request (POST) | Prevents duplicate jobs on retry; UUID chosen by the client |
| `X-Request-ID` | both | Correlation ID; the server generates one if absent |
| `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | response | Rate limit status |
| `ETag` / `If-None-Match` | both | Conditional GET for cached reports (returns `304`) |

### 1.4 Pagination
Cursor-based on list endpoints.

Request: `?limit=20&cursor=<opaque>` (default `limit=20`, max `100`)

Response envelope:
```json
{
  "data": [ ],
  "page": { "next_cursor": "eyJpZCI6...", "has_more": true }
}
```

### 1.5 Error format
All errors use the same shape:
```json
{
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "No company found for ticker 'XYZ'.",
    "details": { "ticker": "XYZ" },
    "request_id": "7f1c2a9e-1d3b-4c7e-9a52-3c1f0b0f8a11"
  }
}
```

| HTTP | Meaning | Example `code` |
|---|---|---|
| 400 | Malformed request | `INVALID_REQUEST` |
| 401 | Missing or invalid token | `UNAUTHENTICATED`, `TOKEN_EXPIRED` |
| 403 | Role not permitted | `FORBIDDEN` |
| 404 | Resource not found | `COMPANY_NOT_FOUND`, `JOB_NOT_FOUND`, `REPORT_NOT_FOUND` |
| 409 | Conflict | `JOB_ALREADY_RUNNING`, `EMAIL_TAKEN` |
| 422 | Validation failure | `VALIDATION_ERROR` |
| 429 | Rate limited | `RATE_LIMITED` (includes `Retry-After`) |
| 502 | Upstream data source failure | `UPSTREAM_UNAVAILABLE` |
| 503 | Dependency down (LLM, DB, graph) | `SERVICE_UNAVAILABLE` |
| 500 | Unexpected error | `INTERNAL_ERROR` |

### 1.6 Rate limits (defaults)
| Role | Reads | Analysis jobs |
|---|---|---|
| investor | 120 req/min | 10 jobs/hour |
| analyst | 300 req/min | 60 jobs/hour |
| admin | 600 req/min | unlimited |

Free-tier LLM limits (Gemini 15 req/min) are enforced internally by a queue; clients see slower job completion, not errors.

---

## 2. Shared Data Models

### 2.1 `Severity`
`info` | `low` | `medium` | `high` | `critical`

### 2.2 `RiskBand`
| Band | Red Flag Score range |
|---|---|
| `low` | 0 - 24 |
| `moderate` | 25 - 49 |
| `elevated` | 50 - 74 |
| `high` | 75 - 100 |

### 2.3 `Company`
```json
{
  "id": "0b6c...",
  "ticker": "EXAMPLE",
  "isin": "INE000A01010",
  "name": "Example Industries Ltd",
  "cin": "L12345MH2001PLC123456",
  "exchange": ["NSE", "BSE"],
  "sector": "Textiles",
  "market_cap_bucket": "small",
  "status": "active"
}
```

### 2.4 `Flag` (a single red flag)
```json
{
  "id": "f3a1...",
  "company_id": "0b6c...",
  "domain": "related_party",
  "type": "circular_rpt_loop",
  "severity": "high",
  "confidence": 0.82,
  "title": "Circular transactions between three linked entities",
  "explanation": "Funds moved from the company to Entity A, then to Entity B, and back within 90 days.",
  "detected_by": "network_graph_agent",
  "detected_at": "2026-11-24T10:58:00Z",
  "status": "new",
  "evidence": [ { "...": "see Evidence" } ]
}
```
`domain`: `related_party` | `promoter_pledge` | `sentiment_reality_gap` | `order_book_spoofing` | `accounting_manipulation` | `auditor` | `disclosure`
`status`: `new` | `under_review` | `confirmed` | `dismissed` | `resolved`

### 2.5 `Evidence`
```json
{
  "id": "e91b...",
  "type": "document_excerpt",
  "document_id": "d77c...",
  "page": 214,
  "bbox": { "x0": 72.0, "y0": 310.5, "x1": 523.0, "y1": 382.0 },
  "quote": "short excerpt only",
  "metric": null,
  "graph_path": null,
  "url": null
}
```
`type`: `document_excerpt` | `financial_metric` | `graph_path` | `price_volume_pattern` | `order_book_window` | `external_url`.
Quotes are kept short; the PDF viewer shows the full context via `page` and `bbox`.

### 2.6 `Job`
```json
{
  "job_id": "a4d8...",
  "type": "company_analysis",
  "status": "running",
  "progress": 0.6,
  "stages": [
    { "agent": "doc_synthesizer", "status": "succeeded" },
    { "agent": "forensic_accounting", "status": "succeeded" },
    { "agent": "network_graph", "status": "running" },
    { "agent": "microstructure", "status": "queued" },
    { "agent": "meta_cio", "status": "queued" }
  ],
  "created_at": "2026-11-24T10:55:00Z",
  "started_at": "2026-11-24T10:55:02Z",
  "finished_at": null,
  "report_id": null,
  "error": null
}
```
`status`: `queued` | `running` | `succeeded` | `partial` | `failed` | `cancelled`
`partial` means some agents failed but a usable report was produced; failed stages show `"status": "failed"` with a reason.

---

## 3. Auth Endpoints

### 3.1 `POST /auth/register` (Public)
Request:
```json
{ "email": "user@example.com", "password": "S3cure!pass", "display_name": "Asha" }
```
Response `201`:
```json
{ "user": { "id": "u1...", "email": "user@example.com", "display_name": "Asha", "role": "investor" } }
```
Errors: `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR` (password policy).

### 3.2 `POST /auth/login` (Public)
Request: `{ "email": "...", "password": "..." }`
Response `200`:
```json
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "expires_in": 1800, "token_type": "bearer" }
```
Errors: `401 INVALID_CREDENTIALS`.

### 3.3 `POST /auth/refresh` (Public)
Request: `{ "refresh_token": "..." }` -> new token pair.

### 3.4 `POST /auth/logout`
Revokes the refresh token. Response `204`.

### 3.5 `GET /auth/me`
Returns the current user profile and notification preferences.

### 3.6 `PATCH /auth/me`
Update `display_name` and `notification_prefs`:
```json
{
  "notification_prefs": {
    "channels": ["push", "email"],
    "min_severity": "high",
    "quiet_hours": { "start": "23:00", "end": "07:00", "timezone": "Asia/Kolkata" }
  }
}
```

### 3.7 `POST /auth/devices`
Register an FCM token for push alerts.
```json
{ "fcm_token": "dXk...", "platform": "android", "app_version": "0.1.0" }
```
Response `201`. `DELETE /auth/devices/{device_id}` removes it.

---

## 4. Company Endpoints

### 4.1 `GET /companies/search`
Search by name, ticker, or ISIN. Role: any.

Query: `q` (required, min 2 chars), `limit` (default 10)

Response `200`:
```json
{ "data": [ { "id": "0b6c...", "ticker": "EXAMPLE", "name": "Example Industries Ltd", "latest_score": 68, "risk_band": "elevated" } ] }
```

### 4.2 `GET /companies/{company_ref}`
`company_ref` is a UUID, ticker, or ISIN.

Response `200`:
```json
{
  "company": { "...": "Company" },
  "latest_report": {
    "report_id": "r55...",
    "red_flag_score": 68,
    "risk_band": "elevated",
    "generated_at": "2026-11-23T18:00:00Z",
    "data_freshness": { "financials_as_of": "2026-09-30", "last_filing_checked": "2026-11-22" }
  },
  "flag_counts": { "critical": 0, "high": 2, "medium": 3, "low": 1, "info": 4 }
}
```
Returns `latest_report: null` if the company has never been analyzed.

### 4.3 `GET /companies/{company_ref}/financials`
Query: `statement` (`balance_sheet` | `profit_loss` | `cash_flow`), `basis` (`standalone` | `consolidated`), `period_type` (`annual` | `quarter`), `years` (default 5).

Response `200`:
```json
{
  "company_id": "0b6c...",
  "unit": "INR_CRORE",
  "periods": ["2026-03-31", "2025-03-31"],
  "line_items": [
    { "code": "revenue_from_operations", "label": "Revenue from operations", "values": [1250.4, 1103.9] },
    { "code": "trade_receivables", "label": "Trade receivables", "values": [420.1, 288.7] }
  ]
}
```

### 4.4 `GET /companies/{company_ref}/forensic-metrics`
Computed ratios (Beneish M-Score and components, CFO-to-PAT, receivable days, etc.) with history.

Response `200`:
```json
{
  "company_id": "0b6c...",
  "m_score": {
    "value": -1.62,
    "threshold": -1.78,
    "interpretation": "likely_manipulator",
    "components": { "dsri": 1.45, "gmi": 1.08, "aqi": 1.12, "sgi": 1.13, "depi": 0.97, "sgai": 0.95, "lvgi": 1.04, "tata": 0.06 }
  },
  "ratios": [
    { "code": "cfo_to_pat", "series": [ { "period": "2026-03-31", "value": 0.42 } ], "peer_percentile": 12.5 }
  ]
}
```
`interpretation`: `unlikely_manipulator` | `grey_zone` | `likely_manipulator`. This is a statistical indicator, not proof of manipulation.

### 4.5 `GET /companies/{company_ref}/shareholding`
Query: `quarters` (default 8). Returns promoter %, pledged %, FII/DII/public % per quarter and the top holders.

### 4.6 `GET /companies/{company_ref}/pledges`
Pledge events (`created`, `invoked`, `released`) with dates, shares, and lender where disclosed.

### 4.7 `GET /companies/{company_ref}/auditors`
Auditor history with opinion type, mid-term resignation indicator, emphasis-of-matter, and going-concern notes.

### 4.8 `GET /companies/{company_ref}/score-history`
Query: `from`, `to`. Returns time series of `red_flag_score` with per-agent sub-scores for charting.

---

## 5. Analysis (Async Jobs)

### 5.1 `POST /analysis/jobs`
Start a forensic analysis. Role: any (limits per section 1.6).

Headers: `Idempotency-Key` recommended.

Request:
```json
{
  "company_ref": "EXAMPLE",
  "agents": ["doc_synthesizer", "forensic_accounting", "network_graph", "microstructure"],
  "force_refresh": false
}
```
- `agents` is optional; default is all agents.
- If a fresh report already exists and `force_refresh` is `false`, the response returns the existing report instead of a new job.

Response `202` (new job):
```json
{ "job": { "...": "Job" }, "links": { "self": "/analysis/jobs/a4d8...", "events": "/analysis/jobs/a4d8.../events" } }
```
Response `200` (cache hit):
```json
{ "cached": true, "report_id": "r55...", "links": { "report": "/reports/r55..." } }
```
Errors: `404 COMPANY_NOT_FOUND`, `409 JOB_ALREADY_RUNNING` (returns the existing `job_id`), `429 RATE_LIMITED`.

### 5.2 `GET /analysis/jobs/{job_id}`
Returns the `Job` object (see 2.6). Poll every 2-5 seconds, or use the events stream.

### 5.3 `GET /analysis/jobs/{job_id}/events` (Server-Sent Events)
Streams progress:
```
event: stage
data: {"agent":"network_graph","status":"running","progress":0.6}

event: done
data: {"status":"succeeded","report_id":"r55..."}
```

### 5.4 `DELETE /analysis/jobs/{job_id}`
Cancel a queued or running job. Response `202`. Only the job owner or an admin.

### 5.5 `GET /analysis/jobs`
List the caller's jobs. Query: `status`, `company_ref`, `limit`, `cursor`.

---

## 6. Reports and Flags

### 6.1 `GET /reports/{report_id}`
Role: any.

Response `200`:
```json
{
  "report_id": "r55...",
  "company": { "...": "Company" },
  "generated_at": "2026-11-23T18:00:00Z",
  "red_flag_score": 68,
  "risk_band": "elevated",
  "confidence": 0.74,
  "summary": "Short plain-language summary written by the Meta CIO agent.",
  "agent_scores": {
    "doc_synthesizer": 55,
    "forensic_accounting": 71,
    "network_graph": 80,
    "microstructure": 20
  },
  "top_flags": [ { "...": "Flag (without full evidence)" } ],
  "conflicts_resolved": [
    { "note": "M-Score is in the grey zone but the director graph shows a circular loop; weighted toward graph evidence." }
  ],
  "methodology_version": "1.0",
  "disclaimer": "Risk indicators for review. Not investment advice and not an allegation of wrongdoing."
}
```
Supports `ETag` / `If-None-Match`.

### 6.2 `GET /reports/{report_id}/export`
Query: `format` = `pdf` | `json`. Returns a SEBI-style forensic report file. Role: `analyst`, `admin` for PDF export.

### 6.3 `GET /companies/{company_ref}/reports`
List past reports with scores (cursor pagination).

### 6.4 `GET /companies/{company_ref}/flags`
Query: `severity`, `domain`, `status`, `from`, `to`, `limit`, `cursor`.

### 6.5 `GET /flags/{flag_id}`
Returns the full `Flag` including all `Evidence`.

### 6.6 `POST /flags/{flag_id}/feedback`
Role: `analyst`, `admin`. Used to improve rules and models.
```json
{ "verdict": "false_positive", "comment": "Loan was disclosed and repaid at market interest." }
```
`verdict`: `true_positive` | `false_positive` | `needs_more_data`. Response `201`.

### 6.7 `PATCH /flags/{flag_id}`
Role: `analyst`, `admin`. Update `status` (for example `under_review`, `confirmed`, `dismissed`). A `confirmed` status requires a `note`.

---

## 7. Relationship Graph

### 7.1 `GET /graph/company/{company_ref}`
Returns the network around a company for the Cytoscape.js / Vis.js visualizer. Role: `analyst`, `admin` (investors get a simplified summary via the report).

Query:
| Param | Default | Description |
|---|---|---|
| `depth` | 2 | Hops from the company (max 4) |
| `relation_types` | all | Comma list: `director_of`, `promoter_of`, `shareholder_of`, `transacts_with`, `auditor_of`, `registered_at`, `relative_of` |
| `min_strength` | 0 | Filter weak inferred links |
| `include_unlisted` | true | Include unlisted entities |
| `limit_nodes` | 300 | Hard cap for browser performance |

Response `200`:
```json
{
  "nodes": [
    { "id": "n1", "type": "company", "label": "Example Industries Ltd", "listed": true, "risk_band": "elevated" },
    { "id": "n2", "type": "director", "label": "A. Kumar", "din": "01234567" },
    { "id": "n3", "type": "company", "label": "Kumar Trading Pvt Ltd", "listed": false }
  ],
  "edges": [
    { "id": "e1", "source": "n2", "target": "n1", "relation": "director_of", "declared": true },
    { "id": "e2", "source": "n1", "target": "n3", "relation": "transacts_with", "declared": true, "amount": 85.2, "unit": "INR_CRORE", "fiscal_year": "2025-26" }
  ],
  "highlighted_paths": [
    { "type": "circular_flow", "node_ids": ["n1", "n3", "n4", "n1"], "total_amount": 85.2, "unit": "INR_CRORE" }
  ],
  "truncated": false
}
```
`declared: false` marks links inferred by Abhimanyu (shared address, shared phone, name similarity); the UI should label these as "possible link".

### 7.2 `GET /graph/director/{din}`
All companies linked to a director and the combined risk summary.

### 7.3 `GET /graph/path`
Find a connection between two nodes.
Query: `from_id`, `to_id`, `max_hops` (default 4). Returns the shortest paths.

### 7.4 `POST /graph/expand`
Expand a node on demand from the web portal.
```json
{ "node_id": "n3", "depth": 1, "relation_types": ["transacts_with", "director_of"] }
```

---

## 8. Documents and PDF Inspector

### 8.1 `GET /companies/{company_ref}/documents`
Query: `type` (`annual_report`, `quarterly_results`, `auditor_report`, `sast_disclosure`, `board_outcome`, ...), `from`, `to`.

Response item:
```json
{
  "document_id": "d77c...",
  "type": "annual_report",
  "title": "Annual Report FY2025-26",
  "filing_date": "2026-08-12",
  "source": "bse",
  "page_count": 412,
  "parse_status": "parsed"
}
```

### 8.2 `GET /documents/{document_id}/file`
Streams the original PDF (`application/pdf`). Supports `Range` requests so PDF.js can load pages lazily.

### 8.3 `GET /documents/{document_id}/findings`
Structured findings extracted by DocSynthesizer, each with `page` and `bbox` so the split-screen inspector can scroll to and highlight the paragraph.
```json
{
  "document_id": "d77c...",
  "findings": [
    {
      "id": "fd1",
      "kind": "auditor_qualification",
      "severity": "high",
      "summary": "Auditor could not verify balances of loans given to related parties.",
      "page": 214,
      "bbox": { "x0": 72.0, "y0": 310.5, "x1": 523.0, "y1": 382.0 },
      "flag_id": "f3a1..."
    }
  ]
}
```

### 8.4 `POST /companies/{company_ref}/ask`
Semantic question answering over the company's filings (vector search plus LLM). Role: `analyst`, `admin`.

Request:
```json
{ "question": "Has this company ever delayed loan repayments?", "max_sources": 5 }
```
Response `200`:
```json
{
  "answer": "Short answer grounded in the retrieved passages.",
  "sources": [
    { "document_id": "d77c...", "page": 188, "bbox": { "x0": 70, "y0": 120, "x1": 520, "y1": 190 }, "snippet": "short excerpt" }
  ],
  "confidence": 0.7
}
```
If no supporting passage is found, `answer` states that the filings do not contain evidence and `sources` is empty (no guessing).

---

## 9. Market Microstructure

### 9.1 `GET /companies/{company_ref}/order-book/anomalies`
Query: `from`, `to`, `min_score` (0-1), `limit`.

Response item:
```json
{
  "id": "ob1",
  "window_start": "2026-11-24T04:15:00Z",
  "window_end": "2026-11-24T04:20:00Z",
  "pattern": "layering_spoofing",
  "anomaly_score": 0.91,
  "details": { "cancel_to_order_ratio": 0.94, "peak_depth_imbalance": 3.8 },
  "linked_announcement_id": null
}
```
`pattern`: `layering_spoofing` | `volume_spike_pre_announcement` | `low_delivery_high_volume` | `price_band_pinging`.

### 9.2 `GET /companies/{company_ref}/price-volume`
Query: `from`, `to`, `interval` (`1d` default). Returns OHLCV, delivery %, and circuit-hit markers for chart overlays with flags.

---

## 10. Watchlists and Alerts

### 10.1 Watchlists
| Method and path | Description |
|---|---|
| `GET /watchlists` | List the caller's watchlists |
| `POST /watchlists` | Create: `{ "name": "My stocks" }` |
| `POST /watchlists/{id}/items` | Add: `{ "company_ref": "EXAMPLE" }` |
| `DELETE /watchlists/{id}/items/{company_id}` | Remove |
| `DELETE /watchlists/{id}` | Delete the watchlist |

### 10.2 Alert rules
`POST /alerts/rules`
```json
{
  "scope": { "type": "watchlist", "id": "w9..." },
  "min_severity": "high",
  "domains": ["promoter_pledge", "auditor", "order_book_spoofing"],
  "channels": ["push", "email"],
  "score_threshold": 70
}
```
`scope.type`: `watchlist` | `company` | `all_watched`. Also: `GET /alerts/rules`, `PATCH /alerts/rules/{id}`, `DELETE /alerts/rules/{id}`.

### 10.3 Alerts
- `GET /alerts` - query: `status` (`unread`, `read`, `dismissed`), `severity`, `limit`, `cursor`.
- `POST /alerts/{alert_id}/read` - mark read. Response `204`.
- `POST /alerts/read-all` - mark all read.
- `DELETE /alerts/{alert_id}` - dismiss.

Alert object:
```json
{
  "id": "al1...",
  "company": { "id": "0b6c...", "ticker": "EXAMPLE", "name": "Example Industries Ltd" },
  "flag_id": "f3a1...",
  "severity": "high",
  "headline": "Auditor resigned mid-term at Example Industries",
  "summary": "Filed late last night. Reason cited: pre-occupation.",
  "created_at": "2026-11-24T02:10:00Z",
  "read_at": null,
  "deep_link": "abhimanyu://company/EXAMPLE/flags/f3a1..."
}
```

### 10.4 Push payload (FCM)
```json
{
  "notification": { "title": "High risk flag: EXAMPLE", "body": "Auditor resigned mid-term." },
  "data": { "alert_id": "al1...", "company_ref": "EXAMPLE", "flag_id": "f3a1...", "severity": "high" }
}
```

### 10.5 `GET /portfolio` and `PUT /portfolio`
Optional holdings used to prioritize alerts and show portfolio-level risk.
```json
{ "holdings": [ { "company_ref": "EXAMPLE", "quantity": 100, "avg_buy_price": 245.5 } ] }
```
`GET /portfolio/risk` returns weighted portfolio risk and the holdings with the highest-severity open flags.

---

## 11. WebSocket

### 11.1 `GET /ws` (upgrade)
Authenticate with `?token=<access_token>`. Messages are JSON.

Client subscribes:
```json
{ "action": "subscribe", "channel": "company", "company_ref": "EXAMPLE" }
```
Server events:
```json
{ "event": "score_updated", "company_ref": "EXAMPLE", "red_flag_score": 72, "risk_band": "elevated", "at": "2026-11-24T11:10:00Z" }
{ "event": "flag_created", "company_ref": "EXAMPLE", "flag_id": "f3a1...", "severity": "high" }
{ "event": "job_progress", "job_id": "a4d8...", "progress": 0.8 }
```
Channels: `company`, `watchlist`, `job`. The server pings every 30 seconds; clients reconnect with exponential backoff.

---

## 12. Admin and Internal

Role: `admin`. Not exposed to the mobile app.

| Method and path | Description |
|---|---|
| `GET /admin/health` | Status of API, PostgreSQL, Neo4j, ChromaDB, Redis, LLM providers |
| `GET /admin/jobs` | All jobs with filters |
| `POST /admin/ingestion/run` | Trigger a source: `{ "source": "bse_announcements", "company_ref": null }` |
| `GET /admin/ingestion/status` | Last run, success rate, and lag per source |
| `POST /admin/companies/{company_ref}/reanalyze` | Force a re-run bypassing cache |
| `GET /admin/agent-runs/{run_id}` | Full audit trail (inputs, outputs, model, prompt version, tokens) |
| `GET /admin/usage/llm` | Token usage and rate-limit headroom |

### Public health check
`GET /health` (Public) returns `{ "status": "ok", "version": "0.1.0" }` for hosting-platform probes.

---

## 13. Endpoint Summary

| Area | Endpoints | Min role |
|---|---|---|
| Auth | register, login, refresh, logout, me, devices | public / any |
| Companies | search, profile, financials, forensic-metrics, shareholding, pledges, auditors, score-history | any |
| Analysis | create job, status, events, cancel, list | any |
| Reports and flags | report, export, flags list/detail, feedback, status update | any (feedback/status: analyst) |
| Graph | company graph, director, path, expand | analyst |
| Documents | list, PDF file, findings, ask | any (ask: analyst) |
| Microstructure | order-book anomalies, price-volume | any |
| Alerts | watchlists, rules, alerts, portfolio | any |
| Real-time | WebSocket, SSE | any |
| Admin | health, ingestion, re-run, audit | admin |

---

## 14. Versioning and Change Policy

- Breaking changes require a new path version (`/api/v2`); `v1` stays available for at least 90 days after a successor ships.
- Non-breaking additions (new optional fields, new endpoints, new enum values) can ship in `v1`; clients must ignore unknown fields and handle unknown enum values gracefully.
- `methodology_version` in reports lets clients know when scoring rules changed.
- Every API change is recorded in `CHANGELOG.md`.

---

## 15. Compliance and Safety Notes

- All responses that present scores or flags must show the `disclaimer`: they are statistical risk indicators for review, not investment advice and not allegations of fraud.
- Every flag must include evidence; the API never returns a flag without at least one `Evidence` item.
- Inferred relationships (`declared: false`) must be labeled as "possible" in clients.
- Respect upstream data source terms; the API serves derived analysis and short excerpts, and original filings are served from their stored public copies.

---

## 16. Related Documents

- `ARCHITECTTURE.md` - system design and async flow
- `DATA_SCHEMA.md` - tables behind these resources
- `AGENT.md` and `AI_SYSTEM_DESIGN.md` - agent behavior behind jobs and reports
- `FRAUD_DETECTION_METHODOLOGY.md` - how scores and flags are produced
- `SECURITY.md` - authentication and data-protection details
- `UI_UX_GUIDELINES.md` - how clients should present flags and disclaimers