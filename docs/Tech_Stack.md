# Tech Stack --- Abhimanyu

> **Project identity:** The repository is named **Abhimanyu**. The
> uploaded project proposal describes the platform as **BharatForensic
> AI**. This document uses **Abhimanyu** as the repository/project name
> and follows the technical architecture specified in the BharatForensic
> AI proposal.

## 1. Project Overview

Abhimanyu is an AI-powered, multi-agent forensic intelligence platform
for the Indian stock market (NSE/BSE). It focuses on detecting potential
corporate-governance failures and suspicious financial activity rather
than predicting stock prices.

The platform investigates:

-   Related Party Transaction (RPT) circular loops.
-   Promoter pledge anomalies and promoter-group entity obfuscation.
-   Sentiment-versus-reality gaps between Management Discussion &
    Analysis (MD&A) statements and auditor notes.
-   Potential order-book spoofing and unusual trading-volume patterns.
-   Potential earnings manipulation and suspicious cash-flow patterns.
-   Hidden relationships among directors and corporate entities.

**Important:** A detected anomaly is a risk indicator, not proof that
fraud has occurred. Findings must be supported by evidence and
independently reviewed.

## 2. High-Level Technology Matrix

  -----------------------------------------------------------------------
  Layer                   Selected technology     Purpose
  ----------------------- ----------------------- -----------------------
  Web dashboard           Next.js 14 (App         Institutional-style
                          Router), Tailwind CSS   investigation portal

  Mobile application      Flutter                 Cross-platform Android
                                                  and iOS application

  Mobile state management BLoC                    Reactive state and
                                                  separation of UI from
                                                  business logic

  Backend API             Python, FastAPI,        REST API and service
                          Uvicorn                 layer

  Agent orchestration     LangGraph, LangChain    Stateful multi-agent
                                                  workflows

  GenAI / reasoning       Google Gemini 2.5       Document understanding
                          Flash; Groq API as an   and agent reasoning
                          alternative             

  CIO / report synthesis  Claude 3.5 or           Aggregate agent
  model                   DeepSeek-R1             findings and produce
                                                  forensic reports

  Machine learning        Python, XGBoost,        Numerical anomaly and
                          Isolation Forest        market microstructure
                                                  analysis

  Forensic accounting     Beneish M-Score         Earnings-manipulation
                                                  risk analysis

  Document ingestion      LlamaIndex              Ingestion and retrieval
                                                  of report content

  OCR                     Tesseract               Text extraction from
                                                  scanned PDF pages

  PDF parsing             Python PDF-processing   Extract auditor notes
                          pipeline; Gemini Flash  and financial
                          for structured          disclosures
                          extraction              

  Relational database     Supabase PostgreSQL     Structured company,
                                                  filing, and analysis
                                                  data

  Graph database          Neo4j AuraDB Free;      Director, promoter, and
                          Memgraph as an          entity relationship
                          alternative             mapping

  Vector database         ChromaDB                Semantic retrieval over
                                                  report excerpts

  Embeddings              Hugging Face            Local text embeddings
                          `all-MiniLM-L6-v2`      

  Background jobs         Celery with Redis;      Asynchronous document
                          Python `asyncio` for    and analysis jobs
                          lighter workloads       

  Web scraping            BeautifulSoup,          Public filing and
                          Selenium, Playwright    portal data collection

  Web graph visualization Cytoscape.js or Vis.js  Interactive corporate
                                                  relationship graphs

  PDF viewer              PDF.js                  In-browser report
                                                  inspection and evidence
                                                  navigation

  Push notifications      Firebase Cloud          Mobile risk alerts
                          Messaging (FCM)         

  Mobile offline cache    Hive                    Local storage of
                                                  previously fetched
                                                  reports

  Deployment (prototype)  Render, Railway, or     Low-cost backend
                          local machine           hosting

  Containerized graph     Docker with Memgraph    Local graph database
  option                                          deployment
  -----------------------------------------------------------------------

The proposal targets a zero-cost/student-budget prototype using
open-source software and available free tiers. Free-tier limits and
provider policies can change; verify them before deployment.

## 3. Frontend

### 3.1 Web Dashboard --- Next.js 14

**Selected technologies** - Next.js 14 with App Router - React -
Tailwind CSS - Cytoscape.js or Vis.js - PDF.js

**Responsibilities** - Company search and ticker lookup. - Forensic risk
dashboard and investigation reports. - Interactive director and
corporate-entity relationship graphs. - Split-screen PDF inspection. -
Navigation from a detected red flag to the relevant report passage. -
Display of evidence, metrics, and agent-generated explanations.

**Graph visualization:** Cytoscape.js is the proposed option for
rendering interactive entity networks. Vis.js is an alternative; select
one for the initial implementation rather than integrating both by
default.

**PDF inspection:** PDF.js will render annual reports in the browser.
The application should associate extracted evidence with page and
bounding-box coordinates where available, so an analyst can navigate to
the source passage.

### 3.2 Mobile Application --- Flutter

**Selected technologies** - Flutter - BLoC state management - Hive local
storage - Firebase Cloud Messaging

**Responsibilities** - Quick company/ticker lookup. - View company risk
summaries and high-priority flags. - Receive push notifications for
relevant new alerts. - Cache previously retrieved company reports for
offline reading.

BLoC separates business logic and network events from UI rendering. Hive
provides lightweight local caching; it is not the platform's primary
shared database.

## 4. Backend and API Layer

### Python + FastAPI + Uvicorn

FastAPI is the backend microservice framework, with Uvicorn serving the
application.

**Backend responsibilities** - Expose APIs to the web and mobile
clients. - Accept company/ticker investigation requests. - Coordinate
document ingestion and analysis. - Read and write structured records in
PostgreSQL. - Query Neo4j for entity relationships. - Retrieve relevant
report excerpts from ChromaDB. - Dispatch long-running work to
background workers. - Return investigation status, evidence, risk
indicators, and reports.

Keep long-running PDF and multi-agent investigations out of ordinary
request-response execution. The API should return a job identifier or
status response while background processing continues.

## 5. Multi-Agent AI Architecture

### LangGraph + LangChain

LangGraph is the stateful workflow orchestrator. LangChain supports the
model and tool integrations used by agents.

The proposal defines an **Orchestrator Agent (Meta CIO)** coordinating
three main specialist capabilities:

  -----------------------------------------------------------------------
  Agent / role            Technologies            Responsibilities
  ----------------------- ----------------------- -----------------------
  DocSynthesizer (GenAI   LlamaIndex, Gemini      Parse annual reports,
  Data Agent)             Flash                   auditor qualification
                                                  notes, and SEBI SAST
                                                  disclosures into
                                                  structured JSON

  Microstructure Fraud    XGBoost, Isolation      Analyze order-book data
  (ML Agent)              Forest, Python          for potential spoofing
                                                  and sudden volume
                                                  anomalies

  Forensic Accounting (ML Python, Beneish M-Score Calculate
  capability)                                     earnings-manipulation
                                                  indicators and flag
                                                  suspicious
                                                  cash-flow-to-EBITDA
                                                  divergence

  Network Graph Agent     Neo4j, LangGraph        Map director DINs and
                                                  corporate
                                                  relationships;
                                                  investigate potential
                                                  related-party networks

  Chief Investment        Claude 3.5 or           Aggregate signals,
  Officer / Meta CIO      DeepSeek-R1             handle conflicting
                                                  metrics, and generate a
                                                  SEBI-style forensic
                                                  risk report
  -----------------------------------------------------------------------

### Workflow

1.  Receive a company ticker or investigation request.
2.  Build a shared investigation state.
3.  Run document, numerical-forensic, and relationship-analysis tasks.
4.  Store structured findings and supporting evidence.
5.  Aggregate specialist outputs through the Orchestrator / Meta CIO.
6.  Generate an explainable forensic report with risk indicators and
    source references.

LangGraph should maintain the shared workflow state and explicit agent
outputs. The proposal's sample workflow demonstrates a
`MarketAuditState` containing the ticker, Beneish M-Score, related-party
network data, and final forensic risk score.

### LLM selection

-   **Primary low-cost model:** Google Gemini 2.5 Flash, as listed in
    the proposal's student stack.
-   **Alternative API:** Groq API, subject to the models available
    through the service.
-   **Report-synthesis options:** Claude 3.5 or DeepSeek-R1, as listed
    for the CIO role in the proposal.
-   Keep model selection configurable. Do not hard-code
    provider-specific logic into every agent.

The proposal mentions multiple model options; it does not establish that
all of them must run simultaneously.

## 6. Machine Learning and Forensic Analysis

### 6.1 Numerical anomaly detection

-   **Python:** Main implementation language for analysis pipelines.
-   **XGBoost:** Proposed for supervised classification or scoring tasks
    where suitable labelled data is available.
-   **Isolation Forest:** Proposed for detecting unusual patterns in
    order-book and numerical data.
-   **Beneish M-Score:** Accounting-based indicator for assessing
    possible earnings manipulation.

### 6.2 Forensic signals

The system is intended to investigate: - Revenue and earnings
anomalies. - Cash-flow-to-EBITDA divergence. - Unusual trading-volume
and order-book activity. - Promoter pledge anomalies. - Differences
between management commentary and auditor observations. - Related-party
transaction patterns.

Model outputs should include the input metrics, relevant period,
evidence source, and explanation. Avoid presenting an ML anomaly score
as a definitive fraud verdict.

## 7. Data Ingestion and Document Processing

  -----------------------------------------------------------------------
  Data requirement        Proposed source /       Technology
                          method                  
  ----------------------- ----------------------- -----------------------
  Corporate announcements BSE/NSE announcement    Python, BeautifulSoup,
                          feeds and XML/XBRL      Selenium
                          disclosures             

  Annual reports and      Public BSE/NSE PDF      PDF processing,
  auditor notes           links                   Tesseract OCR, Gemini
                                                  Flash

  Financial fundamentals  Screener.in and         BeautifulSoup, yfinance
                          yfinance for prototype  
                          research                

  Production financial    CMIE Prowess or         Provider integration
  data                    Refinitiv, subject to   
                          access/licensing        

  Director and company    MCA-21 public portal    Playwright, DIN
  relationships           and company filings     extraction

  Order-book information  NSE India endpoints,    Python HTTP clients and
                          subject to access and   data-processing
                          terms                   pipeline

  SEBI SAST disclosures   Public                  XML/XBRL and document
                          corporate/regulatory    ingestion
                          disclosures             
  -----------------------------------------------------------------------

### Document processing pipeline

1.  Discover and retrieve a filing or annual-report document.
2.  Preserve the source URL, company, filing date, and document
    metadata.
3.  Extract embedded text; use Tesseract OCR for scanned pages.
4.  Use LlamaIndex and Gemini Flash to identify and structure relevant
    sections.
5.  Store normalized facts and extracted passages in PostgreSQL.
6.  Generate embeddings for relevant text chunks and store them in
    ChromaDB.
7.  Retain page references and source evidence for analyst verification.

### Data access note

The proposal identifies public portals and scraping approaches. Actual
access, rate limits, authentication, licensing, and permitted use must
be checked for each source. Do not assume that an endpoint is
unrestricted or that a scraper can bypass access controls. Production
financial-data providers may require paid subscriptions.

## 8. Database and Storage Architecture

### 8.1 Supabase PostgreSQL --- Relational Database

Use PostgreSQL for structured and transactional application data,
including: - Company and ticker records. - Filing and announcement
metadata. - Extracted financial metrics. - Investigation jobs and
statuses. - Agent outputs and risk indicators. - User-facing
investigation reports and alert records.

Supabase is the proposed hosted PostgreSQL option for the student
prototype.

### 8.2 Neo4j --- Graph Database

Use Neo4j to represent relationships that are difficult to investigate
through ordinary relational joins.

**Potential graph entities** - Company - Director - Promoter - Related
entity - Filing

**Potential relationships** - `DIRECTOR_OF` - `PROMOTER_OF` -
`RELATED_TO` - `TRANSACTED_WITH` - `DISCLOSED_IN`

Director Identification Numbers (DINs) from available filings can help
resolve director identities across companies. Relationship findings must
retain their source and date.

**Deployment options:** Neo4j AuraDB Free or Memgraph through Docker.
Choose one graph database for the initial implementation.

### 8.3 ChromaDB --- Vector Database

Use ChromaDB to store embeddings of annual-report passages, auditor
notes, and other relevant text chunks.

**Purpose** - Semantic search over historical filings. - Retrieve
relevant passages for agent questions. - Support evidence-backed
explanations. - Connect generated findings to the original source text.

### 8.4 Hugging Face Embeddings

**Model:** `all-MiniLM-L6-v2`

The proposal selects this lightweight embedding model for local CPU
inference using PyTorch, reducing dependence on paid embedding APIs.

### Storage responsibility summary

  -----------------------------------------------------------------------
  Storage                             What belongs there
  ----------------------------------- -----------------------------------
  PostgreSQL                          Structured business records,
                                      financial metrics, jobs, reports

  Neo4j                               Company/director/promoter
                                      relationship network

  ChromaDB                            Semantic vectors and searchable
                                      document chunks

  Hive                                Mobile-device offline cache
  -----------------------------------------------------------------------

These stores serve different purposes and should not be treated as
interchangeable.

## 9. Background Processing and Asynchronous Tasks

### Celery + Redis

Use Celery workers with Redis as the proposed task queue for
compute-heavy or long-running jobs, such as: - Processing large
annual-report PDFs. - Running OCR and document extraction. - Generating
embeddings. - Running ML analysis. - Executing multi-agent
investigations. - Refreshing data from supported sources.

Python `asyncio` is an alternative for lighter asynchronous I/O tasks.
It is not a direct replacement for a durable distributed task queue when
jobs must survive worker or process restarts.

**Execution pattern** 1. Client submits an investigation request. 2.
FastAPI validates it and creates a job record in PostgreSQL. 3. FastAPI
dispatches the job to Celery/Redis. 4. A worker performs ingestion and
analysis. 5. Results and status are persisted. 6. The client retrieves
updated status and the completed report.

## 10. Alerts and Notifications

### Firebase Cloud Messaging (FCM)

FCM delivers push notifications to Flutter devices.

Example alert events: - A newly ingested filing contains a potentially
significant auditor observation. - A company's investigation risk
indicators change. - The analysis pipeline detects unusual order-book
activity. - A high-priority investigation report is ready.

Notifications should link to the underlying evidence and clearly
distinguish an automated flag from a verified finding.

## 11. Deployment and Development Infrastructure

The proposal targets a zero-cost student prototype.

  -----------------------------------------------------------------------
  Component                           Proposed option
  ----------------------------------- -----------------------------------
  FastAPI backend                     Render, Railway, or local machine

  PostgreSQL                          Supabase free tier

  Graph database                      Neo4j AuraDB Free or local Memgraph
                                      with Docker

  Vector database                     ChromaDB hosted locally or on the
                                      application server

  ML and embeddings                   Local Python/PyTorch execution
                                      where practical

  LLM access                          Gemini free tier or available Groq
                                      API tier

  Mobile notifications                Firebase Cloud Messaging
  -----------------------------------------------------------------------

Free tiers can have usage limits, sleeping services, storage caps, or
changing terms. Confirm current limits before relying on them for a live
demonstration.

## 12. Suggested Repository Structure

The following is a proposed implementation structure based on the
architecture in the project proposal. It is a recommendation, not a
directory structure explicitly mandated by the proposal.

``` text
Abhimanyu/
│
├── frontend/
│   ├── web/                    # Next.js 14 dashboard
│   └── mobile/                 # Flutter application
│
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI routes
│   │   ├── agents/             # LangGraph agents
│   │   ├── services/           # Application services
│   │   ├── models/             # Data models
│   │   ├── schemas/            # API schemas
│   │   └── main.py
│   └── workers/                # Celery tasks
│
├── data_pipeline/
│   ├── scrapers/               # BSE, NSE, MCA-21 ingestion
│   ├── documents/              # PDF extraction and OCR
│   └── processors/             # Data cleaning and normalization
│
├── ml/
│   ├── accounting/              # Beneish M-Score analysis
│   ├── anomaly_detection/       # XGBoost and Isolation Forest
│   └── evaluation/
│
├── database/
│   ├── postgres/
│   ├── neo4j/
│   └── vector/
│
├── docs/
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

## 13. Four-Member Development Allocation

  -----------------------------------------------------------------------
  Member                  Responsibility          Main technologies
  ----------------------- ----------------------- -----------------------
  Member 1 --- Frontend   Flutter application,    Flutter, BLoC, Next.js,
  Lead                    BLoC state, mobile      Tailwind CSS,
                          alerts, Next.js         Cytoscape.js, PDF.js,
                          dashboard, graph        FCM
                          viewer, PDF reader      

  Member 2 --- Data       BSE/NSE XBRL ingestion, Python, Playwright,
  Pipelines & Scrapers    MCA-21 DIN relationship BeautifulSoup,
                          extraction, data        PostgreSQL
                          cleaning, PostgreSQL    
                          population              

  Member 3 --- Agentic AI Stateful orchestrator,  LangGraph, LangChain,
  & LangGraph             DocSynthesizer, Gemini  LlamaIndex, Gemini
                          integration, prompt     
                          engineering             

  Member 4 --- ML Models  Isolation Forest,       Python, XGBoost,
  & Graph DB              Beneish M-Score, graph  Isolation Forest, Neo4j
                          schema and relationship 
                          queries                 
  -----------------------------------------------------------------------

Coordinate API contracts and shared data schemas early so the four
workstreams can integrate without incompatible interfaces.

## 14. Environment Configuration

Keep credentials and environment-specific settings outside source
control. The exact variable names should be finalized during
implementation.

Example `.env.example` categories:

``` env
# Backend
APP_ENV=development
API_HOST=127.0.0.1
API_PORT=8000

# PostgreSQL / Supabase
DATABASE_URL=

# Graph database
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=

# Vector database
CHROMA_HOST=
CHROMA_PORT=

# LLM providers
GEMINI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=

# Background processing
REDIS_URL=

# Notifications
FIREBASE_CREDENTIALS_PATH=
```

Do not commit `.env` files, API keys, database passwords,
service-account credentials, or private user data. Use deployment
secrets for hosted environments.

## 15. Implementation Priorities

A practical implementation order for the proposed stack:

1.  **Foundation:** FastAPI, PostgreSQL, company/ticker records, and
    basic Next.js dashboard.
2.  **Data ingestion:** Start with a small, reproducible set of public
    filings and financial statements.
3.  **Document intelligence:** PDF extraction, OCR, LlamaIndex, and
    Gemini-based structured extraction.
4.  **Forensic accounting:** Implement and validate Beneish M-Score
    calculations and financial anomaly checks.
5.  **Relationship intelligence:** Build the Neo4j schema and ingest a
    limited, verifiable set of director relationships.
6.  **Agent orchestration:** Connect specialist outputs through
    LangGraph and generate evidence-backed reports.
7.  **Market microstructure:** Add order-book analysis only after a
    reliable and permitted data source is established.
8.  **Frontend expansion:** Add interactive graph inspection, PDF
    evidence navigation, Flutter reports, offline cache, and FCM alerts.
9.  **Evaluation and hardening:** Test data quality, false positives,
    model performance, access controls, and system reliability.

## 16. Important Engineering Principles

-   **Evidence traceability:** Every important finding should link to
    the filing, source passage, metric, or data interval that supports
    it.
-   **Explainability:** Show why a risk indicator was raised and which
    inputs contributed to it.
-   **Data quality:** Validate dates, units, financial periods, company
    identifiers, and missing values before analysis.
-   **Entity resolution:** Use DIN and corporate identifiers carefully;
    do not merge entities based only on similar names.
-   **Model evaluation:** Measure false positives and false negatives
    using a documented evaluation dataset.
-   **Security:** Protect API keys, database credentials, user
    information, and investigation history.
-   **Responsible reporting:** Use terms such as *potential anomaly*,
    *risk indicator*, and *requires verification* unless wrongdoing has
    been established by authoritative evidence.

------------------------------------------------------------------------

**Architecture reference:** `Project_Proposal.pdf` --- *BharatForensic
AI: Institutional-Grade Multi-Agent Forensic Tool for the Indian Stock
Market* (7 pages).

**Note:** This document records the technologies and design choices
described in the proposal, organizes them into an implementation-ready
stack, and labels additional implementation structure as
recommendations. It does not imply that every component has already been
implemented.
