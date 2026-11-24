# AI_SYSTEM_DESIGN.md

**Project:** Abhimanyu (BharatForensic AI)
**Version:** 0.1.0 (design baseline)
**Last updated:** 2026-11-24

> This document specifies how the AI parts of Abhimanyu work: the agents, their inputs and outputs, prompts, retrieval, scoring, safety guardrails, and how quality is measured. System-level structure lives in `ARCHITECTTURE.md`; detection rules live in `FRAUD_DETECTION_METHODOLOGY.md`; per-agent role cards live in `AGENT.md`.

---

## 1. Design Principles

1. **Detect governance failure, not price direction.** No agent forecasts prices.
2. **Right tool for each job.** Language models read text. Statistics and ML handle numbers. Graph queries handle relationships. No LLM does arithmetic that code can do.
3. **Evidence or it did not happen.** Every flag must cite a source: filing page and bounding box, metric value, graph path, or order book window. Flags without evidence are discarded.
4. **Structured in, structured out.** Agents exchange validated JSON (Pydantic schemas), never free text, except the final human-readable summary.
5. **Deterministic where possible.** Rules and formulas run first; the LLM interprets and explains. Temperature stays low (0 to 0.2) for extraction.
6. **Honest uncertainty.** Each signal carries a confidence value. Missing data is reported as missing, never filled by guessing.
7. **Indicators, not accusations.** Output language is "risk indicator for review", never "fraud" as a conclusion about a named company.
8. **Free-tier friendly.** Prompts are compact, results are cached, and every LLM call goes through a rate-limited gateway with fallbacks.

---

## 2. System Overview

```
                                   ┌───────────────────────────────┐
                                   │ Router (validate, cache check)│
                                   └──────────────┬────────────────┘
        ┌──────────────────────┬──────────────────┼───────────────────┬──────────────────────┐
        ▼                      ▼                  ▼                   ▼                      │
┌────────────────┐   ┌──────────────────┐  ┌───────────────┐  ┌──────────────────┐          │
│ DocSynthesizer │   │ Forensic         │  │ Network Graph │  │ Microstructure   │          │
│ (GenAI + RAG)  │   │ Accounting (ML)  │  │ (Neo4j+agent) │  │ (ML on ticks)    │          │
└───────┬────────┘   └────────┬─────────┘  └───────┬───────┘  └────────┬─────────┘          │
        │  doc_findings       │ metrics            │ network           │ anomalies           │
        └──────────────┬──────┴────────────────────┴───────────────────┘                     │
                       ▼                                                                      │
              ┌──────────────────┐        ┌────────────────────┐     ┌───────────────────┐   │
              │ Evidence Validator│──────►│ Meta CIO           │────►│ Report Builder    │◄──┘
              │ (rule-based)     │        │ (reasoning LLM)    │     │ + Alert Dispatcher│
              └──────────────────┘        └────────────────────┘     └───────────────────┘
```

- **Router** and **Evidence Validator** are plain code, not LLMs.
- The four specialist agents run **in parallel** and write to separate keys in shared state.
- The **Meta CIO** only sees structured signals plus short evidence snippets, never whole documents.

---

## 3. Model Selection

| Role | Primary (free tier) | Fallback | Notes |
|---|---|---|---|
| Document extraction and tone analysis | Gemini 2.5 Flash | Groq Llama-3 | Long context helps for report sections; JSON output mode |
| Meta CIO reasoning | Gemini 2.5 Flash (or DeepSeek-R1 if available) | Groq Llama-3 70B | Production upgrade path: Claude 3.5 class model |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` (local CPU) | none needed | 384-dimension vectors; no API cost |
| OCR | Tesseract | none | Only for scanned PDFs |
| Anomaly detection | scikit-learn Isolation Forest, XGBoost | none | Trained offline, served in-process |

**Model gateway** (`llm_client.py`) wraps all providers:
- token-bucket rate limiter (Gemini free tier: 15 requests/min),
- retry with exponential backoff and jitter,
- automatic provider fallback on 429/5xx,
- response cache keyed by `hash(model, prompt_version, input_hash)`,
- logging of tokens, latency, model, and `prompt_version` for each call.

---

## 4. Agent Specifications

### 4.1 DocSynthesizer (GenAI + RAG)

**Purpose:** Turn long, unstructured filings into structured findings with exact page locations.

**Inputs:** PDF annual reports, auditor reports, SAST disclosures, board outcomes.

**Pipeline**
1. **Text extraction:** native PDF text via PyMuPDF; OCR (Tesseract) for pages without a text layer. Keep per-word bounding boxes.
2. **Section detection:** locate high-value sections: Auditor's Report (including CARO annexure and Key Audit Matters), Notes to Accounts (related party disclosures, contingent liabilities, loans and advances, going concern), MD&A, Directors' Report.
3. **Chunking:** section-aware chunks of about 500-800 tokens with 80-token overlap; each chunk stores `document_id`, `page_start`, `page_end`, `section_label`, and bounding boxes.
4. **Embedding and indexing:** MiniLM embeddings into ChromaDB; metadata mirrored in PostgreSQL.
5. **Targeted extraction:** run a fixed set of extraction prompts per section (not one giant prompt).
6. **Validation:** every extracted value must be traceable to a quote that exists in the chunk text (string-match check) and numeric values are cross-checked against parsed financial tables where available.

**Output schema (excerpt)**
```json
{
  "document_id": "d77c...",
  "auditor": {
    "opinion": "qualified",
    "emphasis_of_matter": true,
    "going_concern_doubt": false,
    "key_audit_matters": ["Revenue recognition", "Recoverability of loans to related parties"],
    "findings": [
      {
        "kind": "auditor_qualification",
        "summary": "Auditor could not obtain evidence for balances of loans to related parties.",
        "quote": "unable to obtain sufficient appropriate audit evidence",
        "page": 214,
        "bbox": [72.0, 310.5, 523.0, 382.0],
        "confidence": 0.9
      }
    ]
  },
  "related_party": { "transactions": [ ], "total_rpt_pct_of_revenue": 18.4 },
  "contingent_liabilities": { "total": 312.5, "unit": "INR_CRORE", "yoy_change_pct": 140.0 },
  "mdna_tone": { "optimism_score": 0.78, "hedging_score": 0.12, "forward_claims": ["Order book at record high"] }
}
```

**Extraction prompt template (auditor section)**
```
SYSTEM:
You are a forensic reading assistant for Indian company filings.
Extract only what the text explicitly states. Never infer or guess.
If a field is not stated, return null. Quote the exact words that support each finding
(maximum 25 words per quote). Respond with JSON that matches the schema. No commentary.

USER:
SCHEMA: {auditor_schema_json}
SECTION TEXT (page {page_start}-{page_end}):
"""
{chunk_text}
"""
```

**MD&A tone vs reality:** the model rates MD&A language on optimism and hedging, and lists concrete forward claims. These are compared with numeric facts (cash flow, receivables, auditor notes) by the Meta CIO. Tone scores are only used in combination with hard evidence, never as a standalone flag.

### 4.2 Forensic Accounting Agent (ML and math)

**Purpose:** Quantify earnings-manipulation risk from financial statements. Pure Python, no LLM.

**Computations**
- **Beneish M-Score** (8-variable): DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA. Interpretation: values above about -1.78 indicate higher manipulation likelihood (threshold configurable; many practitioners use -2.22 as the stricter cutoff).
- **Cash quality:** CFO/PAT, CFO/EBITDA, accrual ratio, and multi-year divergence.
- **Working capital stress:** receivable days vs revenue growth, inventory days, unexplained rise in "other current assets".
- **Balance sheet signals:** cash and bank balance vs borrowings and interest paid (high cash with high debt), capital work-in-progress that never capitalizes, loans and advances growth.
- **Earnings quality:** other income share of profit before tax, one-off gains.
- **Peer context:** percentile rank within sector for each ratio.
- **Altman Z-Score and Piotroski F-Score** as supporting indicators.

**Data checks before computing:** unit normalization (lakh/crore), standalone vs consolidated basis, restatements, missing years. If inputs are incomplete, the agent returns `status: "insufficient_data"` rather than a score.

**Output:** metric values, component breakdown, flags with severity, and a sub-score (0-100).

> Note: Beneish was developed on US manufacturing firms; financial companies (banks, NBFCs, insurers) are excluded from M-Score and use sector-specific ratios instead.

### 4.3 Network Graph Agent (Neo4j + LangGraph sub-agent)

**Purpose:** Find hidden related-party networks and circular flows.

**Graph build (offline, in the ingestion pipeline):**
- Nodes: `Company`, `Director` (DIN as key), `Shareholder`, `Auditor`, `Address`.
- Edges: `DIRECTOR_OF`, `PROMOTER_OF`, `SHAREHOLDER_OF`, `AUDITOR_OF`, `TRANSACTS_WITH`, `REGISTERED_AT`, `RELATIVE_OF`.
- Entity resolution: DIN is exact; companies match on CIN; names use fuzzy matching with a confidence score. Inferred edges (shared address or phone, name similarity) are stored with `declared = false` and a strength value.

**Query playbook (templated Cypher, parameterized, run by code):**
1. Shared-director neighbors that are unlisted.
2. Circular transaction paths of length 2 to 5 returning to the origin company.
3. Shared registered address clusters (many companies, one address).
4. Promoter group entities missing from the declared promoter group.
5. Rapid director rotation across linked entities.
6. Concentration: single counterparty share of related-party sales or loans.

**Role of the LLM:** the agent chooses which playbook queries to run given the company profile and summarizes returned paths in plain language. It never writes free-form Cypher against the production graph; only whitelisted, parameterized templates run. This prevents injection and runaway queries (limits: depth 5, 500 nodes, 10-second timeout).

**Output:** subgraph for the visualizer, highlighted paths, amount totals, and a network sub-score. Inferred links are tagged as "possible".

### 4.4 Microstructure Fraud Agent (ML)

**Purpose:** Detect order book spoofing and suspicious volume patterns, especially before announcements.

**Features (per 1-5 minute window):** cancel-to-order ratio, order lifetime distribution, depth imbalance, large-order add/cancel bursts at levels away from the touch, quote stuffing rate, volume z-score vs 20-day baseline, delivery percentage, price-band pinging near circuits.

**Models**
- **Isolation Forest** (unsupervised) for unusual windows; baseline trained per liquidity bucket.
- **XGBoost** classifier when labeled episodes exist (for example from SEBI orders on spoofing or manipulation); until then it runs in shadow mode.
- **Event-study rule:** abnormal volume or price drift in the 1-5 days before material announcements, compared with that stock's own baseline.

**Output:** anomaly windows with score, pattern name, and feature contributions (SHAP values for XGBoost), plus a microstructure sub-score. The agent never claims intent; it reports statistical abnormality.

**Data caveat:** public NSE endpoints may not provide full L2/L3 depth. The design supports lower-granularity inputs (snapshots, volume and delivery data) and marks results with the data resolution used.

### 4.5 Meta CIO (reasoning LLM)

**Purpose:** Combine heterogeneous signals, resolve conflicts, and write the SEBI-style report.

**Inputs (structured only):**
- agent sub-scores and status (`ok`, `insufficient_data`, `failed`),
- top flags with confidence and short evidence snippets,
- data freshness metadata,
- previous report (to explain what changed).

**Reasoning steps (enforced in the prompt and checked in code):**
1. List signals by domain with severity and confidence.
2. Identify corroboration: two or more independent agents pointing at the same issue raise confidence.
3. Identify conflicts: for example, a clean M-Score alongside a circular loop; explain which evidence dominates and why.
4. Identify missing data and state its effect on confidence.
5. Produce the Red Flag Score *explanation*; the numeric score itself comes from the scoring function in section 6 (see below), and the LLM may adjust it only within a bounded range.
6. Write the summary, key findings, and "what to check next".

**Output schema:**
```json
{
  "summary": "string, max 120 words, plain language",
  "key_findings": [ { "flag_id": "f3a1...", "why_it_matters": "string" } ],
  "conflicts_resolved": [ { "note": "string" } ],
  "confidence": 0.74,
  "score_adjustment": { "value": 3, "reason": "string" },
  "what_to_check_next": ["Read Note 38 on related-party loans", "Review director X's other boards"],
  "disclaimer_included": true
}
```

**Meta CIO system prompt (abridged)**
```
You are the Chief Investment Officer of a forensic risk desk for Indian listed companies.
You receive structured signals from specialist agents. You do not see raw filings.
Rules:
- Use only the signals provided. Do not add facts.
- Every claim must reference a flag_id from the input.
- Describe findings as risk indicators for review. Never state or imply that the company
  or any person committed fraud.
- Treat inferred relationships (declared=false) as possible links, not facts.
- If an agent's status is not "ok", say what is missing and lower confidence.
- score_adjustment must be between -10 and +10 and must be justified by corroboration
  or conflict between agents.
- Output valid JSON matching the schema. Keep the summary under 120 words.
```

---

## 5. Orchestration (LangGraph)

### 5.1 State
```python
class MarketAuditState(TypedDict):
    job_id: str
    ticker: str
    company_id: str
    requested_agents: list[str]
    doc_findings: dict | None
    forensic_metrics: dict | None
    network: dict | None
    microstructure: dict | None
    agent_status: dict[str, str]        # ok | insufficient_data | failed
    validated_flags: list[dict]
    red_flag_score: float | None
    report: dict | None
```

### 5.2 Graph
```
START -> router
router -> [doc_synthesizer, forensic_accounting, network_graph, microstructure]   (parallel)
[all four] -> evidence_validator -> scorer -> meta_cio -> report_builder -> alert_dispatcher -> END
```

- **router:** resolves ticker, loads cached agent outputs, decides which agents must re-run (new filing, new quarter, or `force_refresh`).
- **evidence_validator:** drops flags without evidence, de-duplicates, checks quotes exist in source text, and verifies numbers.
- **scorer:** computes the numeric score (section 6).
- **alert_dispatcher:** compares with the previous score and user rules; enqueues push notifications.

### 5.3 Failure handling
- Each agent node has a timeout and a retry policy. A failed node sets `agent_status[agent] = "failed"` and the run continues.
- The Meta CIO receives the failure and lowers confidence; the job ends as `partial` (see `API_SPECIFICATION.md`).
- Checkpointing: state is saved after each node so a crashed worker can resume.

---

## 6. Scoring

The numeric **Red Flag Score (0-100)** is computed by code so it is reproducible. The LLM explains it and may apply a bounded adjustment.

```
domain_score(d) = 100 * (1 - Π(1 - w_sev(f) * confidence(f)))   for flags f in domain d
overall_raw     = Σ domain_weight(d) * domain_score(d)
overall         = clamp(overall_raw + score_adjustment, 0, 100)
```

| Severity | `w_sev` |
|---|---|
| info | 0.02 |
| low | 0.08 |
| medium | 0.20 |
| high | 0.40 |
| critical | 0.65 |

| Domain | Initial weight |
|---|---|
| accounting_manipulation | 0.25 |
| related_party | 0.25 |
| promoter_pledge | 0.15 |
| auditor | 0.15 |
| order_book_spoofing | 0.10 |
| sentiment_reality_gap | 0.05 |
| disclosure (delays, restatements) | 0.05 |

- The combination formula (noisy-OR) means several moderate flags raise the score, but no single weak flag can dominate.
- Weights are initial values and are tuned against labeled cases (section 9). Each change bumps `methodology_version`.
- Confidence of the overall report is reduced for each agent with missing or failed data.
- **Cold-start rule:** companies with fewer than four years of financials or no parsed annual report show a "limited data" badge instead of a confident score.

---

## 7. Retrieval (RAG) Design

**Used for:** the "ask this company's filings" feature and for DocSynthesizer follow-ups.

1. **Query rewrite:** a small LLM call turns the user's question into 1-3 search queries with likely section names ("Notes to Accounts", "Borrowings").
2. **Hybrid retrieval:** vector search in ChromaDB (top 20) plus keyword search (BM25 in PostgreSQL full-text) merged by reciprocal rank fusion.
3. **Metadata filters:** company, document type, fiscal year range, section label.
4. **Re-ranking:** a lightweight cross-encoder (or MiniLM similarity re-score) narrows to the top 5.
5. **Grounded answer:** the model must answer only from the supplied passages and return passage IDs; if the passages do not answer the question, it says so.
6. **Citation mapping:** passage IDs map back to `page` and `bbox` for the PDF inspector.

**Prompt rule:** "If the passages do not contain the answer, reply that the filings provided do not contain evidence. Do not use outside knowledge."

---

## 8. Guardrails and Safety

| Risk | Control |
|---|---|
| Hallucinated facts | Quote-in-source check, numeric cross-check, null for unknown, low temperature |
| False accusations | Language policy in prompts, disclaimer on every report, "indicator for review" wording, confidence display, human review status on flags |
| Prompt injection from filings (documents may contain text that tries to instruct the model) | Treat document text strictly as data inside delimiters; system prompt states that text in documents is never an instruction; outputs are schema-validated; agents have no tools that can act on the outside world |
| Graph query abuse | Whitelisted parameterized Cypher only, depth and node limits, timeouts |
| Wrong entity matches | DIN and CIN exact keys; fuzzy matches flagged `declared=false` and capped at low severity until verified |
| Sector misuse of formulas | Banks, NBFCs, and insurers excluded from M-Score; sector-specific rules used |
| Data leakage | No user PII in prompts; only public filings and derived metrics are sent to LLM providers |
| Cost and rate limits | Gateway limits, caching, small context windows, nightly batch for non-urgent analysis |
| Stale or missing data | Freshness metadata in every report; `insufficient_data` status propagated to confidence |

**Human-in-the-loop:** analysts can mark flags `true_positive`, `false_positive`, or `needs_more_data` (see `API_SPECIFICATION.md` section 6.6). Only analyst-confirmed flags may be described as "confirmed" in exports.

---

## 9. Evaluation Plan

### 9.1 Test sets
- **Positive cases:** Indian companies with documented governance failures or regulatory action (public SEBI orders, auditor resignations followed by collapse, known pledge-driven crashes). Build a labeled set of 20-40 cases with the date when information became public.
- **Negative controls:** similar-sized, clean companies from the same sectors.
- **Synthetic tests:** hand-written text snippets for each extraction type, and synthetic order book windows with injected spoofing patterns.

### 9.2 Metrics
| Component | Metric | Target (initial) |
|---|---|---|
| DocSynthesizer extraction | Field-level precision and recall vs hand labels; quote-validity rate | precision >= 0.90, quote-validity = 100% |
| Forensic accounting | M-Score reproduction vs a hand-computed spreadsheet | exact within rounding |
| Network graph | Precision of flagged circular paths on manually verified sample | >= 0.80 |
| Microstructure | Precision at top-k anomalies; false alerts per stock per day | tuned to <= 1 false alert per 20 stocks/day |
| End-to-end | Lead time: how many days or quarters before public collapse the score crossed 50; false positive rate on controls | report as a table; target FPR <= 10% on controls |
| RAG answers | Faithfulness (answer supported by cited passage) and abstention rate on unanswerable questions | faithfulness >= 0.90 |
| Operations | Median job time, cache hit rate, LLM error rate | median < 3 min per company |

### 9.3 Process
- **Backtesting:** run the pipeline using only data available before each event date to avoid look-ahead bias.
- **Regression suite:** a fixed set of documents and expected JSON outputs runs in CI whenever prompts, models, or weights change.
- **Prompt versioning:** prompts live in `backend/agents/prompts/` with a `prompt_version`; every report records the versions used.
- **Ablation:** measure the contribution of each agent by removing it and re-scoring; document it for the final evaluation.
- **Feedback loop:** analyst verdicts feed monthly weight tuning and rule updates.

---

## 10. Observability of AI Behavior

For each agent run, store (see `agent_runs` and `agent_steps` in `DATA_SCHEMA.md`):
- model, `prompt_version`, token counts, latency, cost estimate,
- inputs hash and structured outputs,
- validation results (dropped flags and the reason),
- agent status and error details.

Dashboards (admin): validation drop rate, flags per company, score distribution, LLM error rate, average tokens per report, and drift in score distribution after a model or prompt change.

---

## 11. Performance and Cost Budget (Free Tier)

| Item | Budget |
|---|---|
| LLM calls per full company analysis | about 15-30 (extraction chunks batched by section, 1 Meta CIO call) |
| Gemini free tier throughput | 15 requests/min, so a cold analysis takes a few minutes; the queue smooths bursts |
| Caching | Per-document extraction results cached by content hash; re-analysis reuses them when only market data changes |
| Embeddings | Local CPU; a 300-page report indexes in a few minutes |
| Priority queue | Watched companies and newly filed documents first; bulk backfill runs off-hours |

---

## 12. Extensibility

- **New detectors** plug in as agents that return the common signal schema (`domain`, `type`, `severity`, `confidence`, `evidence[]`).
- **Model upgrades** swap behind the gateway; the regression suite shows the effect.
- **Production data upgrade:** replace scraped fundamentals with CMIE Prowess or Refinitiv without changing agent contracts.
- **Possible future agents:** news and social-media pump detection, credit rating downgrade tracker, insider trading disclosure analysis, and a cross-company "group risk" agent.

---

## 13. Common Signal Schema (all agents)

```json
{
  "agent": "network_graph",
  "status": "ok",
  "sub_score": 80,
  "data_resolution": "daily_snapshot",
  "signals": [
    {
      "domain": "related_party",
      "type": "circular_rpt_loop",
      "severity": "high",
      "confidence": 0.82,
      "title": "string",
      "explanation": "string",
      "evidence": [ { "type": "graph_path", "node_ids": ["n1", "n3", "n4", "n1"] } ]
    }
  ],
  "metadata": { "runtime_ms": 4210, "prompt_version": null, "model": null }
}
```

---

## 14. Related Documents

- `ARCHITECTTURE.md` - system structure and deployment
- `AGENT.md` - agent role cards
- `FRAUD_DETECTION_METHODOLOGY.md` - detailed rules, thresholds, and scoring rationale
- `KNOWLEDGE_BASE.md` - domain knowledge (Indian regulations, accounting standards, red-flag patterns)
- `DATA_SCHEMA.md` - tables for signals, evidence, and agent runs
- `API_SPECIFICATION.md` - how results are exposed
- `DATASET.md` - data sources and labeled evaluation sets
- `SECURITY.md` - data protection and prompt-injection defenses