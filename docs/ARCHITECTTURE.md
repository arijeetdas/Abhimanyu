# ARCHITECTTURE.md

**Project:** Abhimanyu (BharatForensic AI) - Institutional-Grade Multi-Agent Forensic Tool for the Indian Stock Market
**Version:** 0.1.0 (design baseline)
**Last updated:** 2026-11-24

> Abhimanyu does not predict stock prices. It acts as a digital forensic auditor: it reads the dense filings companies publish, maps hidden relationships between promoters and directors, runs forensic accounting math, watches the order book for manipulation, and combines everything into a single **Red Flag Score** and a SEBI-style risk report.

---

## 1. Goals and Constraints

### 1.1 Architectural goals
| Goal | How the architecture serves it |
|---|---|
| Detect governance failure, not price direction | Four specialist detection domains (RPT loops, pledge anomalies, sentiment-vs-reality gaps, order book spoofing) |
| Explainability | Every flag carries evidence: filing page, extracted text, graph path, or metric value |
| Specialization | No single model "knows everything"; text, numbers, and graphs are handled by separate agents |
| Responsiveness | Heavy work (PDF parsing, scraping) runs asynchronously, API returns immediately with a job ID |
| Dual audience | Mobile app for fast retail alerts, web portal for deep analyst investigation |
| $0 budget | Open-source frameworks and free-tier cloud services only (CSE final-year project) |

### 1.2 Constraints
- **Zero-cost infrastructure:** free tiers limit RAM, storage, request rates, and sleep idle services.
- **Fragmented Indian data:** BSE, NSE, MCA-21, and Screener.in expose different formats, and some have no official API.
- **LLM rate limits:** Gemini free tier is 15 requests/min; Groq has its own limits. Agents must queue and cache.
- **Team of four:** the architecture is split along the four work streams (frontend, data pipelines, agentic AI, ML and graph).

---

## 2. System Context

```
                      ┌─────────────────────────────────────────────┐
  Retail Investor ───►│  Flutter Mobile App (iOS / Android)         │
                      └───────────────┬─────────────────────────────┘
                                      │ HTTPS / FCM push
  Analyst ───────────►┌───────────────▼─────────────────────────────┐
                      │  Next.js 14 Web Dashboard                   │
                      └───────────────┬─────────────────────────────┘
                                      │ REST / WebSocket
                      ┌───────────────▼─────────────────────────────┐
                      │  FastAPI Backend (API Gateway + Services)   │
                      └───────────────┬─────────────────────────────┘
                                      │
          ┌───────────────────────────┼─────────────────────────────┐
          │                           │                             │
 ┌────────▼────────┐        ┌─────────▼─────────┐        ┌──────────▼─────────┐
 │ Celery/Redis    │        │ LangGraph Agent   │        │ Data Stores        │
 │ Async Workers   │◄──────►│ Orchestration     │◄──────►│ Postgres, Neo4j,   │
 │ (ingestion)     │        │ Layer             │        │ ChromaDB, Files    │
 └────────┬────────┘        └───────────────────┘        └────────────────────┘
          │
 ┌────────▼────────────────────────────────────────────────────────────┐
 │ External sources: BSE/NSE feeds, MCA-21, Screener.in, yfinance,     │
 │ NSE order book endpoints                                            │
 └─────────────────────────────────────────────────────────────────────┘
```

External services used: Firebase Cloud Messaging (push), Gemini / Groq (LLM APIs).

---

## 3. High-Level Layered Architecture

| Layer | Responsibility | Main technologies |
|---|---|---|
| 1. Presentation | Mobile alerts, quick ticker lookup, analyst deep-dive | Flutter (BLoC, Hive, FCM), Next.js 14 + Tailwind, Cytoscape.js / Vis.js, PDF.js |
| 2. API | Auth, request validation, job dispatch, report retrieval | FastAPI + Uvicorn |
| 3. Orchestration | Run the multi-agent investigation and combine signals | LangGraph + LangChain |
| 4. Agents | Specialized analysis (text, ML, accounting, graph) | LlamaIndex, Gemini Flash, XGBoost, Isolation Forest, Neo4j |
| 5. Async processing | Long-running ingestion and parsing jobs | Celery + Redis (or asyncio task queue) |
| 6. Data | Relational, graph, vector, and file storage | Supabase PostgreSQL, Neo4j AuraDB Free, ChromaDB, object/file storage |
| 7. Ingestion | Scrapers and feed readers | Playwright, BeautifulSoup, Selenium, Tesseract OCR |

---

## 4. Multi-Agent System

The platform simulates an institutional risk desk. Each agent has one job; the Orchestrator combines their outputs.

### 4.1 Agent roster

| Agent | Type | Stack | Inputs | Outputs |
|---|---|---|---|---|
| **Orchestrator / Meta CIO** | Reasoning LLM | Claude 3.5 / DeepSeek-R1 (or Gemini / Groq on free tier) | Signals from all agents | Unified Red Flag Score and SEBI-style report |
| **DocSynthesizer** | GenAI | LlamaIndex, Gemini Flash | Annual report PDFs, auditor qualification notes, SAST disclosures | Structured JSON (auditor flags, contingent liabilities, going-concern notes, MD&A tone) |
| **Forensic Accounting** | ML / math | Python, Beneish M-Score | Multi-year financial statements | M-Score, cash-flow vs EBITDA divergence flags |
| **Microstructure Fraud** | ML | XGBoost, Isolation Forest | NSE L2/L3 order book ticks, volume data | Spoofing and pre-announcement volume anomaly scores |
| **Network Graph** | Agentic | Neo4j, LangGraph | Director DINs, MCA filings, RPT data | Hidden related-party networks, circular trading paths |

### 4.2 Four detection domains

1. **Related Party Transaction loops:** circular flows found via MCA-21 filings and Neo4j path queries.
2. **Promoter pledge anomalies and entity obfuscation:** sudden pledge increases, promoter-group entities hidden behind shell structures.
3. **Sentiment vs reality gap:** management's upbeat MD&A tone compared against auditor notes and financial reality.
4. **Order book spoofing:** abnormal order placement and cancellation patterns in real-time ticks.

### 4.3 Orchestration workflow (LangGraph)

The state object shared by all nodes:

```python
class MarketAuditState(TypedDict):
    ticker: str
    m_score: float
    related_party_network: dict
    doc_findings: dict
    microstructure_score: float
    forensic_risk_score: float
```

**Baseline flow** (from the proposal): `ML_Forensics -> Network_Graph -> Meta_CIO -> END`.

**Recommended target flow** (parallel fan-out so total latency equals the slowest agent, not the sum):

```
                    ┌──► DocSynthesizer ────────┐
                    │                           │
 START ─► Router ───┼──► ML_Forensics (M-Score) ─┼──► Meta_CIO ─► Report ─► END
                    │                           │
                    ├──► Network_Graph ─────────┤
                    │                           │
                    └──► Microstructure ────────┘
```

- **Router** validates the ticker, checks cache freshness, and decides which agents must re-run.
- **Fan-out/fan-in** nodes run concurrently and write to disjoint keys in the shared state.
- **Meta_CIO** receives all signals, resolves conflicts (for example, a clean M-Score but a suspicious graph), and writes the final report.
- Each node records its inputs, outputs, and timing to an audit log for explainability.

### 4.4 Why this design
- Text-reading, number-crunching, and relationship-mapping are fundamentally different tasks; separating them keeps each agent simple and testable.
- Math agents (M-Score, anomaly detection) are deterministic or statistical, so they do not hallucinate. The LLM is used only where language understanding is needed.
- The Orchestrator reasons over structured signals, not raw documents, which lowers token cost and error risk.

---

## 5. Data Architecture

### 5.1 Storage by purpose

| Store | Technology (free tier) | Holds | Why |
|---|---|---|---|
| Relational | Supabase PostgreSQL (500 MB) | Companies, filings metadata, financials, signals, users, alerts, job status | Structured, transactional data |
| Graph | Neo4j AuraDB Free (200k nodes/relationships) or Memgraph in Docker | Directors (DIN), companies, shareholders, RPT edges | Shell structures and circular flows are graph problems that SQL handles poorly |
| Vector | ChromaDB (local or on server), Pinecone/Milvus in production | Embeddings of annual-report text chunks | Semantic retrieval, e.g. "Has this company ever delayed loan payments?" |
| Files | Local disk / free object storage | Raw PDFs, XBRL, OCR output | Source of truth for the PDF inspector |
| Cache / queue | Redis | Celery broker, result cache, rate-limit counters | Async jobs and API-limit protection |

> The relational tables are specified in `DATA_SCHEMA.md`. Where that document models relationships in PostgreSQL edge tables, this architecture treats **Neo4j as the primary graph store** and PostgreSQL as the mirror and system of record; keep both documents in sync.

### 5.2 Embeddings
- Model: HuggingFace `all-MiniLM-L6-v2`, running locally on CPU via PyTorch (no API cost).
- Chunking: split by document section (Notes to Accounts, Auditor's Report, MD&A) with page and bounding-box metadata so results can highlight the exact paragraph in the PDF viewer.

### 5.3 Graph model (Neo4j)

Nodes: `Company`, `Director` (DIN), `Shareholder`, `Auditor`, `Address`
Relationships: `DIRECTOR_OF`, `PROMOTER_OF`, `SHAREHOLDER_OF`, `AUDITOR_OF`, `TRANSACTS_WITH {amount, year}`, `REGISTERED_AT`, `RELATIVE_OF`

Example detection query (circular flow between related companies):

```cypher
MATCH path = (c:Company {ticker: $ticker})-[:TRANSACTS_WITH*2..5]->(c)
RETURN path
```

Example (hidden link via shared director):

```cypher
MATCH (x:Company {ticker: $ticker})<-[:DIRECTOR_OF]-(d:Director)-[:DIRECTOR_OF]->(y:Company)
WHERE y <> x AND y.listed = false
RETURN y, collect(d) AS shared_directors
```

---

## 6. Data Ingestion Pipeline

```
Sources ──► Scrapers/Feed readers ──► Raw store ──► Parsers ──► Normalizers ──► Databases
```

| Source | Method | Data | Cadence |
|---|---|---|---|
| BSE/NSE corporate announcements | XML/XBRL feeds, RSS, Python scrapers | Auditor resignations, board outcomes, SAST disclosures | Near real-time polling |
| Annual report PDFs | Download, Tesseract OCR if scanned, Gemini Flash parsing | "Notes to Accounts", auditor qualifications | On new filing |
| Financial fundamentals | Screener.in scraper + yfinance (open source); CMIE Prowess / Refinitiv (production) | Multi-year balance sheets, P&L, cash flow | Quarterly |
| MCA-21 director network | Playwright automated browser | DIN, directorships, linked companies | Weekly refresh plus on-demand |
| NSE order book | Public REST endpoints with session cookie, rotating headers | L2/L3 ticks, volume | Market hours, near real-time |

**Pipeline stages**
1. **Fetch:** scheduler triggers scrapers; each fetch is idempotent and stores raw output with a content hash.
2. **Parse:** PDFs go through OCR (when needed) and LLM-based extraction into structured JSON.
3. **Normalize and resolve entities:** map names and DINs to canonical company and person IDs; fuzzy-match shell company names.
4. **Load:** write to PostgreSQL, Neo4j, and ChromaDB.
5. **Trigger analysis:** a new filing or anomaly enqueues an agent run for that company.

---

## 7. Asynchronous Execution

Document analysis is compute-heavy and free-tier web hosts time out quickly, so the API never does long work inline.

```
Client ─POST /analyze─► FastAPI ─enqueue─► Redis ─► Celery worker ─► LangGraph run
   ▲                        │                                          │
   │◄──── 202 + job_id ─────┘                                          ▼
   └───── poll / WebSocket / push notification ◄──────────── result saved in DB
```

- **Job states:** `queued -> running -> succeeded | failed`.
- **Fallback:** where Redis is not available, use a Python `asyncio` task queue.
- **Rate-limit handling:** a token-bucket in Redis throttles Gemini (15 req/min) and scraper calls; failed calls retry with exponential backoff.
- **Caching:** reports are cached per ticker and filing version; agents re-run only when new data arrives.

---

## 8. Backend Services (FastAPI)

Logical modules inside the single FastAPI deployment (split into services later if needed):

| Module | Responsibility |
|---|---|
| `auth` | Sign-up, login, JWT sessions, device tokens for FCM |
| `companies` | Ticker search, company profile, latest score |
| `analysis` | Create analysis jobs, job status, fetch report |
| `graph` | Return graph neighborhoods for the web visualizer |
| `documents` | Serve PDFs and extracted findings with bounding boxes |
| `alerts` | Watchlists, alert rules, alert history |
| `ingestion` | Internal endpoints and schedulers for scrapers |
| `admin` | Health checks, job monitoring, manual re-run |

API contracts are defined in `API_SPECIFICATION.md`.

---

## 9. Frontend Architecture

### 9.1 Flutter mobile app (retail investors)
- **State management:** BLoC pattern; blocs react to network events and push updates to the UI, keeping rendering separate from logic.
- **Offline storage:** Hive caches risk reports and watchlists for review without network.
- **Push alerts:** Firebase Cloud Messaging for pre-market spoofing flags and late-night auditor resignation filings.
- **Screens:** ticker search, Red Flag Score card, flag list with plain-language explanation, watchlist, alert history.

### 9.2 Next.js 14 web portal (analysts)
- **Stack:** App Router, Tailwind CSS.
- **Interactive graph visualizer:** Cytoscape.js / Vis.js to drag nodes, inspect DIN links, and expand circular trade paths.
- **PDF split-screen inspector:** PDF.js with bounding-box highlighting; clicking an alert scrolls the original annual report to the exact paragraph.
- **Other views:** score breakdown by agent, M-Score history, order book anomaly timeline, report export.

### 9.3 Division of responsibility
Flutter handles lightweight alerts and quick lookups; the web portal handles multi-window PDF and graph investigation.

---

## 10. Key Runtime Flows

### 10.1 On-demand company analysis
1. User searches a ticker in the app or web portal.
2. FastAPI checks the cache; if the report is fresh it returns immediately.
3. Otherwise it creates a job and returns a `job_id`.
4. A Celery worker starts the LangGraph run; agents execute in parallel.
5. Meta CIO builds the report and Red Flag Score; results are stored.
6. Client receives the result via polling, WebSocket, or push notification.

### 10.2 New filing detected (proactive)
1. Scheduler polls BSE/NSE feeds and finds a new filing (for example an auditor resignation).
2. The ingestion pipeline downloads and parses it, then updates the databases.
3. An analysis job is queued for that company.
4. If the Red Flag Score crosses a user's threshold, FCM sends a push alert to watchers.

### 10.3 Order book spoofing alert
1. Market-hours worker pulls NSE order book snapshots for watched tickers.
2. Microstructure agent scores each window with Isolation Forest / XGBoost.
3. High-confidence anomalies create a signal and trigger an immediate alert.

---

## 11. Deployment Architecture ($0 Strategy)

| Component | Host | Notes |
|---|---|---|
| FastAPI + Uvicorn | Render.com / Railway free tier, or local machine | Free instances sleep when idle; first request may be slow |
| Celery worker + Redis | Same host or a second free service; local Docker for demos | Redis free tier (for example Upstash) if hosted |
| PostgreSQL | Supabase free (500 MB) | Prune raw text, keep large files outside the DB |
| Neo4j | AuraDB Free (200k nodes/relationships) or Memgraph in Docker | Prioritize listed companies and their direct neighbors to stay within limits |
| ChromaDB | Local or server disk | Persist the collection directory |
| Web portal | Vercel free tier | Next.js native hosting |
| Mobile app | Android APK and iOS TestFlight/simulator | FCM free |
| LLM APIs | Gemini 2.5 Flash free tier, Groq Llama-3 free API | Keep prompts compact; cache every response |

**Environments:** `local` (Docker Compose for Postgres, Redis, Memgraph, Chroma), `staging` (free-tier cloud), `production-demo`.

**Configuration:** secrets such as API keys, DB URLs, and Firebase credentials are provided through environment variables, never committed (see `SECURITY.md`).

---

## 12. Cross-Cutting Concerns

### 12.1 Explainability and audit trail
- Every flag stores its evidence: source filing, page, bounding box, graph path, metric values.
- Every agent run logs inputs, outputs, model name, prompt version, and timing.
- Reports show the contribution of each agent to the final score.

### 12.2 Security
- JWT authentication, role-based access (investor vs analyst vs admin).
- Input validation on all endpoints; rate limiting per user and IP.
- Secrets kept in environment variables or a secret manager.
- Avoid storing sensitive personal data; store hashed identifiers where matching is needed.

### 12.3 Observability
- Structured JSON logs with a `job_id` and `ticker` on each line.
- Health endpoint for API, DB, Redis, and graph connectivity.
- Basic metrics: job duration, queue depth, LLM error rate, scraper success rate.

### 12.4 Reliability
- Idempotent ingestion jobs and retry with backoff.
- Graceful degradation: if one agent fails, the Orchestrator reports a partial result and marks that signal as unavailable instead of failing the whole run.
- Fallback LLM provider (Groq) if Gemini is rate-limited.

### 12.5 Scalability path
| Stage | Change |
|---|---|
| Prototype | Single FastAPI instance, local Celery worker |
| Beta | Separate worker service, hosted Redis, paid Postgres tier |
| Production | Managed Neo4j, Pinecone/Milvus, institutional data (CMIE Prowess / Refinitiv), horizontal workers |

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scraping targets (NSE, MCA-21, Screener.in) block or change layout | Data gaps | Resilient parsers, retries, rotating headers, cached snapshots, plan to move to licensed data |
| Terms-of-service and legal concerns with scraping | Legal exposure | Respect robots.txt and rate limits, use official feeds where available, document sources, use licensed APIs for production |
| LLM hallucination in extracted findings | False flags | Require page citations, validate numbers against financial tables, human review status on flags |
| Free-tier limits (RAM, storage, nodes, rate) | Outages | Prune data, cache aggressively, prioritize watched companies |
| False positives harming reputations | Defamation risk | Present flags as "risk indicators for review", show confidence and evidence, avoid accusatory wording |
| Entity resolution errors (same-name directors) | Wrong graph links | Use DIN as the key, confidence scores, mark inferred links separately |
| Cold starts on free hosts | Slow first response | Keep-alive pings, async job pattern, cached reports |

---

## 14. Team Mapping (4 Members)

| Member | Owns |
|---|---|
| 1. Frontend Lead | Flutter app (BLoC, Hive, FCM), Next.js portal (Cytoscape.js, PDF.js) |
| 2. Data Pipelines | Playwright and BeautifulSoup scrapers, BSE/NSE XBRL feeds, MCA-21 DIN extraction, PostgreSQL loading |
| 3. Agentic AI | LangGraph orchestrator, DocSynthesizer, Gemini prompt pipeline, vector retrieval |
| 4. ML and Graph | Isolation Forest / XGBoost on order book ticks, Beneish M-Score, Neo4j schema and queries |

---

## 15. Suggested Repository Layout

```
abhimanyu/
├── docs/                    # this documentation set
├── backend/
│   ├── app/                 # FastAPI app (routers, schemas, services)
│   ├── agents/              # docsynth, forensic, microstructure, network, cio
│   ├── graph/               # LangGraph workflow definitions
│   ├── ingestion/           # scrapers, feed readers, OCR, parsers
│   ├── workers/             # Celery tasks
│   └── tests/
├── web/                     # Next.js 14 portal
├── mobile/                  # Flutter app
├── infra/                   # docker-compose, deployment configs
└── README.md
```

---

## 16. Related Documents

- `PRD.md` - product requirements and user stories
- `AI_SYSTEM_DESIGN.md` - prompts, agent contracts, evaluation
- `AGENT.md` - detailed agent responsibilities
- `API_SPECIFICATION.md` - endpoints and payloads
- `DATA_SCHEMA.md` - database tables
- `DATASET.md` - data sources and ingestion detail
- `FRAUD_DETECTION_METHODOLOGY.md` - scoring and rules
- `Tech_Stack.md` - technology choices
- `SECURITY.md` - security policy
- `DEVELOPMENT_ROADMAP.md` - delivery phases