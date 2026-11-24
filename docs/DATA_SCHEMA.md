# DATA_SCHEMA.md

**Project:** Abhimanyu - AI Based Stock Market Predictor and Investment Platform
**Purpose:** Defines the data model that powers Abhimanyu's fraud-detection agents: company filings, promoter/director relationship graph, financial statements, market data, fraud signals, and investor alerts.

> Abhimanyu does not try to predict prices. It reads company filings, uncovers hidden promoter relationships, and flags accounting fraud and pump-and-dump patterns in the Indian market before they make the news. The schema is built around that mission.

---

## 1. Storage Overview

| Layer | Technology | What it stores |
|---|---|---|
| Relational (system of record) | PostgreSQL | Companies, people, filings metadata, financials, signals, alerts, users |
| Vector store | PostgreSQL + `pgvector` | Embeddings of filing text chunks for retrieval (RAG) |
| Relationship graph | PostgreSQL edge tables (optional mirror to Neo4j) | Promoter / director / company / auditor connections |
| Time-series | PostgreSQL (partitioned by month) or TimescaleDB | Daily price, volume, delivery data |
| Object storage | S3-compatible bucket | Raw PDFs, XBRL files, HTML, extracted text |
| Cache / queues | Redis | Job queues for agents, rate limiting, hot alert feeds |

**Conventions**
- Primary keys: `UUID` (v7 preferred) unless noted. Natural identifiers (ISIN, CIN, PAN) are stored as unique columns, never as PKs.
- Timestamps: `TIMESTAMPTZ`, stored in UTC; display in IST.
- Money: `NUMERIC(20,2)` in INR. Store the reporting unit in a `unit` column (e.g. `INR`, `INR_LAKH`, `INR_CRORE`) when raw values are kept as reported.
- Soft delete: `deleted_at TIMESTAMPTZ NULL` on user-facing tables.
- Every table has `created_at` and `updated_at`.
- Enumerations are Postgres `ENUM`s or `CHECK` constraints; values are listed below.

---

## 2. Entity Relationship Overview

```
companies ──< filings ──< filing_chunks (embeddings)
    │             │
    │             └──< extracted_facts
    │
    ├──< financial_statements ──< financial_line_items
    ├──< shareholding_patterns ──< shareholding_entries >── persons / entities
    ├──< pledges
    ├──< related_party_transactions
    ├──< auditor_appointments >── auditors
    ├──< price_daily
    ├──< corporate_actions
    │
    └──< company_persons >── persons          (promoters, directors, KMPs)

relationships (graph edges) ── connects companies / persons / entities
fraud_signals ──> company, evidence ──> filings / chunks / transactions
alerts ──> fraud_signals, delivered to users via watchlists
agent_runs ──< agent_steps  (audit trail of every AI decision)
```

---

## 3. Core Reference Tables

### 3.1 `companies`
Listed (and optionally unlisted/group) companies.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| cin | VARCHAR(21) UNIQUE | MCA Corporate Identification Number |
| isin | VARCHAR(12) UNIQUE NULL | Primary equity ISIN |
| nse_symbol | VARCHAR(20) NULL | |
| bse_code | VARCHAR(10) NULL | |
| name | TEXT | Current legal name |
| former_names | TEXT[] | Name-change history (a common red flag) |
| sector | VARCHAR(80) | |
| industry | VARCHAR(120) | |
| market_cap_bucket | ENUM(`large`,`mid`,`small`,`micro`,`nano`) | |
| listing_date | DATE NULL | |
| registered_state | VARCHAR(50) | |
| registered_address | TEXT | Used to detect shared-address shells |
| status | ENUM(`active`,`suspended`,`delisted`,`under_insolvency`,`asm_gsm`) | |
| exchange_surveillance_stage | VARCHAR(20) NULL | ASM / GSM stage if applicable |
| group_id | UUID FK → business_groups NULL | |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes: `(nse_symbol)`, `(bse_code)`, `(group_id)`, GIN on `former_names`, trigram index on `name`.

### 3.2 `business_groups`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT UNIQUE | e.g. promoter group name |
| description | TEXT NULL | |

### 3.3 `persons`
Individuals: promoters, directors, key managerial personnel, auditors' signing partners, major shareholders.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| full_name | TEXT | As reported |
| normalized_name | TEXT | Lower-cased, de-titled, used for entity resolution |
| din | VARCHAR(8) UNIQUE NULL | Director Identification Number |
| pan_hash | CHAR(64) NULL | SHA-256 of PAN only; raw PAN is never stored |
| date_of_birth_year | SMALLINT NULL | Year only, for disambiguation |
| nationality | VARCHAR(50) NULL | |
| resolution_confidence | NUMERIC(4,3) | Entity-resolution confidence (0-1) |
| merged_into_id | UUID NULL FK → persons | Set when duplicates are merged |

### 3.4 `entities`
Non-person, non-listed counterparties: private companies, LLPs, trusts, partnership firms, foreign investors.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| entity_type | ENUM(`private_company`,`llp`,`trust`,`firm`,`fpi`,`bank`,`nbfc`,`other`) | |
| name | TEXT | |
| cin_or_llpin | VARCHAR(21) NULL | |
| registered_address | TEXT NULL | |
| incorporation_date | DATE NULL | |
| paid_up_capital | NUMERIC(20,2) NULL | |
| company_id | UUID NULL FK → companies | Set if the entity is also a listed company |

### 3.5 `auditors`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| firm_name | TEXT | |
| frn | VARCHAR(20) UNIQUE NULL | ICAI Firm Registration Number |
| peer_review_status | VARCHAR(30) NULL | |

---

## 4. Relationship Layer (Hidden Connections)

### 4.1 `company_persons`
Formal roles of a person in a company.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| person_id | UUID FK | |
| role | ENUM(`promoter`,`promoter_group`,`director`,`independent_director`,`ceo`,`cfo`,`company_secretary`,`kmp`) | |
| start_date | DATE | |
| end_date | DATE NULL | NULL = current |
| resignation_reason | TEXT NULL | Early auditor/CFO resignations are signals |
| source_filing_id | UUID FK → filings NULL | |

### 4.2 `relationships` (generic graph edge table)
All connections discovered or declared, between any two nodes.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| source_type | ENUM(`company`,`person`,`entity`,`auditor`) | |
| source_id | UUID | |
| target_type | ENUM(`company`,`person`,`entity`,`auditor`) | |
| target_id | UUID | |
| relation_type | ENUM(see below) | |
| strength | NUMERIC(4,3) | 0-1 weight |
| is_declared | BOOLEAN | `true` = disclosed in a filing; `false` = inferred by Abhimanyu |
| evidence_ids | UUID[] | Points to `evidence` rows |
| valid_from / valid_to | DATE | |
| discovered_by_run_id | UUID NULL FK → agent_runs | |

`relation_type` values: `director_of`, `promoter_of`, `shareholder_of`, `relative_of`, `common_address`, `common_phone_email`, `common_auditor`, `lender_to`, `borrower_from`, `supplier_to`, `customer_of`, `subsidiary_of`, `associate_of`, `loan_given_to`, `transacts_with`, `same_signatory`.

Unique constraint: `(source_type, source_id, target_type, target_id, relation_type, valid_from)`.
Indexes: `(source_type, source_id)`, `(target_type, target_id)`, `(relation_type)`.

### 4.3 `related_party_transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | Reporting company |
| counterparty_type / counterparty_id | ENUM / UUID | person or entity |
| fiscal_year | VARCHAR(7) | e.g. `2025-26` |
| transaction_type | ENUM(`loan_given`,`loan_taken`,`advance`,`sale`,`purchase`,`guarantee`,`royalty`,`rent`,`investment`,`other`) | |
| amount | NUMERIC(20,2) | |
| outstanding_amount | NUMERIC(20,2) NULL | |
| interest_rate | NUMERIC(6,3) NULL | |
| is_arms_length | BOOLEAN NULL | As stated by the company |
| source_filing_id | UUID FK | |
| page_ref | VARCHAR(30) NULL | |

---

## 5. Filings and Documents

### 5.1 `filings`
Metadata for every document ingested (BSE/NSE announcements, annual reports, MCA filings, SEBI orders, credit rating reports, auditor reports, concall transcripts).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| source | ENUM(`bse`,`nse`,`mca`,`sebi`,`rating_agency`,`company_website`,`news`,`other`) | |
| filing_type | ENUM(`annual_report`,`quarterly_results`,`shareholding_pattern`,`board_outcome`,`auditor_change`,`related_party_disclosure`,`pledge_disclosure`,`insider_trading_disclosure`,`sebi_order`,`rating_report`,`concall_transcript`,`other`) | |
| title | TEXT | |
| filing_date | DATE | |
| period_end | DATE NULL | |
| source_url | TEXT | |
| storage_uri | TEXT | S3 location of raw file |
| content_hash | CHAR(64) UNIQUE | SHA-256, prevents duplicates |
| page_count | INT NULL | |
| language | VARCHAR(10) | |
| parse_status | ENUM(`pending`,`parsed`,`failed`,`needs_ocr`) | |
| ingested_at | TIMESTAMPTZ | |

Indexes: `(company_id, filing_date DESC)`, `(filing_type)`, `(parse_status)`.

### 5.2 `filing_chunks`
Text chunks used for retrieval and citation.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| filing_id | UUID FK | |
| chunk_index | INT | |
| page_start / page_end | INT | |
| section_label | VARCHAR(120) NULL | e.g. "Notes to Accounts - Contingent Liabilities" |
| text | TEXT | |
| token_count | INT | |
| embedding | VECTOR(1024) | Dimension depends on the chosen embedding model |

Index: HNSW on `embedding` (cosine), btree on `(filing_id, chunk_index)`.

### 5.3 `extracted_facts`
Structured facts the AI pulled from text (each with a citation).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| filing_id | UUID FK | |
| chunk_id | UUID FK NULL | |
| fact_type | VARCHAR(60) | e.g. `auditor_qualification`, `going_concern_doubt`, `contingent_liability`, `loan_to_promoter` |
| value_json | JSONB | Structured payload |
| confidence | NUMERIC(4,3) | |
| extracted_by_run_id | UUID FK → agent_runs | |
| verified_by | ENUM(`none`,`rule`,`human`) | |

---

## 6. Financial Data

### 6.1 `financial_statements`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| statement_type | ENUM(`balance_sheet`,`profit_loss`,`cash_flow`) | |
| basis | ENUM(`standalone`,`consolidated`) | |
| period_type | ENUM(`quarter`,`half_year`,`annual`) | |
| period_end | DATE | |
| fiscal_year | VARCHAR(7) | |
| unit | VARCHAR(12) | |
| is_audited | BOOLEAN | |
| is_restated | BOOLEAN | Restatements are a signal |
| source_filing_id | UUID FK | |

Unique: `(company_id, statement_type, basis, period_type, period_end, is_restated)`.

### 6.2 `financial_line_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| statement_id | UUID FK | |
| line_code | VARCHAR(60) | Normalized, e.g. `revenue_from_operations`, `trade_receivables`, `cash_and_bank`, `cfo` |
| reported_label | TEXT | Label exactly as in the filing |
| value | NUMERIC(24,2) | |
| page_ref | VARCHAR(30) NULL | |

### 6.3 `financial_ratios`
Derived metrics computed per period (used by fraud rules).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| period_end | DATE | |
| basis | ENUM(`standalone`,`consolidated`) | |
| ratio_code | VARCHAR(60) | See list below |
| value | NUMERIC(18,6) | |
| peer_percentile | NUMERIC(5,2) NULL | Rank within sector |

`ratio_code` examples: `beneish_m_score`, `altman_z_score`, `piotroski_f_score`, `cfo_to_pat`, `receivable_days`, `receivable_growth_vs_revenue_growth`, `cash_vs_debt_gap`, `interest_coverage`, `promoter_pledge_pct`, `rpt_to_revenue_pct`, `other_income_to_pbt`, `capex_to_cfo`.

---

## 7. Ownership, Pledges and Corporate Actions

### 7.1 `shareholding_patterns`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| quarter_end | DATE | |
| promoter_pct | NUMERIC(6,3) | |
| promoter_pledged_pct | NUMERIC(6,3) | % of promoter holding pledged |
| public_pct | NUMERIC(6,3) | |
| fii_pct / dii_pct | NUMERIC(6,3) | |
| source_filing_id | UUID FK | |

Unique: `(company_id, quarter_end)`.

### 7.2 `shareholding_entries`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| pattern_id | UUID FK | |
| holder_type / holder_id | ENUM / UUID | person or entity |
| category | ENUM(`promoter`,`promoter_group`,`fii`,`dii`,`public_institution`,`public_non_institution`,`other`) | |
| shares | BIGINT | |
| pct | NUMERIC(7,4) | |
| pledged_shares | BIGINT NULL | |

### 7.3 `pledges`
Event-level pledge creation, invocation, and release.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| promoter_id | UUID | person or entity |
| event_type | ENUM(`created`,`invoked`,`released`) | |
| shares | BIGINT | |
| lender_name | TEXT NULL | |
| event_date | DATE | |
| source_filing_id | UUID FK | |

### 7.4 `corporate_actions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| action_type | ENUM(`split`,`bonus`,`rights`,`preferential_allotment`,`warrant_issue`,`buyback`,`dividend`,`name_change`,`merger`,`demerger`,`qip`) | |
| announcement_date | DATE | |
| record_date | DATE NULL | |
| details_json | JSONB | |
| source_filing_id | UUID FK NULL | |

### 7.5 `auditor_appointments`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| auditor_id | UUID FK | |
| start_date / end_date | DATE | |
| resigned_midterm | BOOLEAN | Mid-term resignation is a major flag |
| resignation_reason | TEXT NULL | |
| audit_opinion | ENUM(`unqualified`,`qualified`,`adverse`,`disclaimer`) NULL | |
| emphasis_of_matter | BOOLEAN | |
| going_concern_doubt | BOOLEAN | |

---

## 8. Market Data (for Pump-and-Dump Detection)

### 8.1 `price_daily`
Partitioned by month on `trade_date`.

| Column | Type | Notes |
|---|---|---|
| company_id | UUID FK | |
| trade_date | DATE | PK with company_id |
| open / high / low / close | NUMERIC(14,2) | Adjusted for corporate actions |
| volume | BIGINT | |
| delivery_pct | NUMERIC(5,2) NULL | Low delivery with high volume is suspicious |
| trades_count | INT NULL | |
| circuit_band_pct | NUMERIC(4,1) NULL | |
| hit_upper_circuit | BOOLEAN | |

### 8.2 `bulk_block_deals`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| deal_date | DATE | |
| deal_type | ENUM(`bulk`,`block`) | |
| client_name | TEXT | |
| client_entity_id | UUID NULL | Resolved entity/person |
| side | ENUM(`buy`,`sell`) | |
| quantity | BIGINT | |
| price | NUMERIC(14,2) | |

### 8.3 `social_signals`
Tracks promotion activity (Telegram, YouTube, X, WhatsApp tip groups) around a stock.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| platform | VARCHAR(30) | |
| captured_at | TIMESTAMPTZ | |
| mention_count | INT | |
| unique_authors | INT | |
| coordinated_score | NUMERIC(4,3) | Likelihood of coordinated promotion |
| sample_urls | TEXT[] | |

---

## 9. Fraud Detection Outputs

### 9.1 `fraud_signals`
One row per red flag raised.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| signal_type | ENUM(see below) | |
| category | ENUM(`accounting`,`governance`,`related_party`,`market_manipulation`,`disclosure`,`auditor`) | |
| severity | ENUM(`info`,`low`,`medium`,`high`,`critical`) | |
| confidence | NUMERIC(4,3) | 0-1 |
| title | TEXT | |
| explanation | TEXT | Plain-language reason |
| detected_at | TIMESTAMPTZ | |
| period_end | DATE NULL | |
| status | ENUM(`new`,`under_review`,`confirmed`,`dismissed`,`resolved`) | |
| reviewed_by | UUID NULL FK → users | |
| detected_by | ENUM(`rule`,`ml_model`,`llm_agent`,`manual`) | |
| agent_run_id | UUID NULL FK → agent_runs | |

`signal_type` examples: `revenue_receivable_divergence`, `cfo_pat_mismatch`, `high_beneish_score`, `cash_balance_unverifiable`, `circular_funding_suspected`, `promoter_loan_to_shell`, `shared_address_cluster`, `rapid_pledge_increase`, `auditor_resigned_midterm`, `auditor_qualification`, `unusual_rpt_growth`, `preferential_allotment_to_linked_party`, `volume_price_spike_low_delivery`, `coordinated_social_promotion`, `frequent_name_change`, `delayed_filing`, `restatement`, `contingent_liability_spike`.

### 9.2 `evidence`
Every signal must be traceable to its sources.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| signal_id | UUID FK NULL | |
| relationship_id | UUID FK NULL | |
| evidence_type | ENUM(`filing_chunk`,`financial_line`,`transaction`,`price_pattern`,`graph_path`,`external_url`) | |
| ref_id | UUID NULL | Points to chunk, line item, transaction, etc. |
| quote | TEXT NULL | Short excerpt only |
| page_ref | VARCHAR(30) NULL | |
| url | TEXT NULL | |

### 9.3 `company_risk_scores`
Time-stamped composite score per company.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | UUID FK | |
| scored_at | TIMESTAMPTZ | |
| overall_score | NUMERIC(5,2) | 0 (safe) - 100 (high risk) |
| accounting_score | NUMERIC(5,2) | |
| governance_score | NUMERIC(5,2) | |
| market_manipulation_score | NUMERIC(5,2) | |
| methodology_version | VARCHAR(20) | Links to `FRAUD_DETECTION_METHODOLOGY.md` |
| top_signal_ids | UUID[] | |

Index: `(company_id, scored_at DESC)`.

### 9.4 `signal_feedback`
Human review that trains and tunes the system.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| signal_id | UUID FK | |
| user_id | UUID FK | |
| verdict | ENUM(`true_positive`,`false_positive`,`needs_more_data`) | |
| comment | TEXT NULL | |

---

## 10. AI Agent Audit Trail

### 10.1 `agent_runs`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| agent_name | VARCHAR(60) | e.g. `filing_reader`, `promoter_graph`, `forensic_accountant`, `market_watch`, `alert_writer` |
| trigger | ENUM(`schedule`,`new_filing`,`user_request`,`signal_followup`) | |
| company_id | UUID NULL FK | |
| started_at / finished_at | TIMESTAMPTZ | |
| status | ENUM(`running`,`succeeded`,`failed`,`cancelled`) | |
| model_name | VARCHAR(60) | |
| prompt_version | VARCHAR(20) | |
| input_tokens / output_tokens | INT | |
| cost_usd | NUMERIC(10,4) | |

### 10.2 `agent_steps`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| run_id | UUID FK | |
| step_index | INT | |
| step_type | ENUM(`retrieval`,`tool_call`,`reasoning_summary`,`rule_check`,`output`) | |
| input_json | JSONB | |
| output_json | JSONB | |
| duration_ms | INT | |

Retention: raw `input_json`/`output_json` kept 90 days, summaries kept indefinitely.

---

## 11. Users, Watchlists and Alerts

### 11.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | CITEXT UNIQUE | |
| password_hash | TEXT NULL | Null when using OAuth only |
| display_name | TEXT | |
| role | ENUM(`investor`,`analyst`,`admin`) | |
| risk_tolerance | ENUM(`conservative`,`moderate`,`aggressive`) NULL | |
| notification_prefs | JSONB | Channels, quiet hours, minimum severity |
| email_verified_at | TIMESTAMPTZ NULL | |
| last_login_at | TIMESTAMPTZ NULL | |

### 11.2 `watchlists` and `watchlist_items`
| Table | Columns |
|---|---|
| watchlists | id UUID PK, user_id FK, name, created_at |
| watchlist_items | id UUID PK, watchlist_id FK, company_id FK, added_at, UNIQUE(watchlist_id, company_id) |

### 11.3 `portfolio_holdings`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| company_id | UUID FK | |
| quantity | NUMERIC(18,4) | |
| avg_buy_price | NUMERIC(14,2) | |
| source | ENUM(`manual`,`broker_import`,`csv`) | |

### 11.4 `alerts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| signal_id | UUID FK | |
| company_id | UUID FK | |
| severity | ENUM(`info`,`low`,`medium`,`high`,`critical`) | |
| headline | TEXT | |
| summary | TEXT | AI-written, plain language |
| channel | ENUM(`in_app`,`email`,`push`,`whatsapp`,`telegram`) | |
| status | ENUM(`queued`,`sent`,`read`,`dismissed`,`failed`) | |
| sent_at / read_at | TIMESTAMPTZ NULL | |

Unique: `(user_id, signal_id, channel)` prevents duplicate alerts.

---

## 12. Example Queries

**Companies sharing a director with a company that has a critical signal**
```sql
SELECT DISTINCT c2.name
FROM fraud_signals fs
JOIN company_persons cp1 ON cp1.company_id = fs.company_id AND cp1.end_date IS NULL
JOIN company_persons cp2 ON cp2.person_id = cp1.person_id AND cp2.company_id <> cp1.company_id
JOIN companies c2 ON c2.id = cp2.company_id
WHERE fs.severity = 'critical' AND fs.status IN ('new','under_review','confirmed');
```

**Companies with rising promoter pledges over the last 3 quarters**
```sql
SELECT company_id,
       MAX(promoter_pledged_pct) - MIN(promoter_pledged_pct) AS pledge_rise
FROM shareholding_patterns
WHERE quarter_end >= (CURRENT_DATE - INTERVAL '9 months')
GROUP BY company_id
HAVING MAX(promoter_pledged_pct) - MIN(promoter_pledged_pct) > 10;
```

**Semantic search over filings**
```sql
SELECT fc.id, fc.filing_id, fc.page_start, fc.text
FROM filing_chunks fc
ORDER BY fc.embedding <=> :query_embedding
LIMIT 10;
```

---

## 13. Data Quality, Privacy and Compliance

- **Public data only:** all sources are public disclosures (exchanges, MCA, SEBI, rating agencies). No non-public or insider information is stored.
- **PII minimization:** raw PAN, Aadhaar, phone numbers, and bank details of private individuals are never stored. Hashes are used for matching where needed.
- **Entity resolution:** person/entity matches below `resolution_confidence` 0.85 are shown as "possible link" and never raised as high-severity signals without human review.
- **Provenance:** every fact, relationship, and signal links back to a filing, page, or data point via `evidence`.
- **Defamation safety:** signals are phrased as "flags for review" and carry confidence scores; `status = confirmed` requires human verification.
- **Retention:** raw filings retained indefinitely; agent step logs 90 days; alerts 2 years; user data deleted within 30 days of account deletion.
- **Backups:** daily full backup, point-in-time recovery for 7 days.

---

## 14. Migration and Versioning

- Schema changes are managed through versioned migrations (e.g. Alembic or Prisma Migrate), one migration per change.
- `methodology_version` and `prompt_version` are stored with every score and agent run so past results can be reproduced.
- Breaking changes are recorded in `CHANGELOG.md`.

---

## 15. Related Documents

- `ARCHITECTURE.md` - how services use these tables
- `API_SPECIFICATION.md` - API shapes derived from this schema
- `FRAUD_DETECTION_METHODOLOGY.md` - rules behind `fraud_signals` and `company_risk_scores`
- `AI_SYSTEM_DESIGN.md` - agents that write to `extracted_facts` and `agent_runs`
- `DATASET.md` - data sources and ingestion
- `SECURITY.md` - access control and data protection