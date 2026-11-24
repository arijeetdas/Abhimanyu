# Product Requirements Document (PRD)

## Abhimanyu --- AI-Powered Forensic Intelligence Platform for the Indian Stock Market

**Document status:** Product requirements draft\
**Project/repository name:** Abhimanyu\
**Proposal name:** BharatForensic AI\
**Target market:** Indian stock market (NSE/BSE)\
**Primary objective:** Identify and explain potential
corporate-governance failures and suspicious financial or market
activity to help investors and analysts investigate listed companies.

> **Naming note:** The repository is named **Abhimanyu**, while the
> supplied project proposal is titled **BharatForensic AI**. This PRD
> uses Abhimanyu as the product name and retains the proposal's scope
> and terminology.

------------------------------------------------------------------------

## 1. Product Overview

Abhimanyu is an AI-powered, multi-agent forensic intelligence platform
designed to investigate Indian listed companies. It analyzes corporate
filings, annual reports, financial statements, director relationships,
and available market data to identify potential warning signs that may
be difficult for ordinary investors to discover manually.

Unlike conventional stock-market applications that primarily focus on
price movements and predictions, Abhimanyu focuses on the underlying
integrity of a company's financial disclosures, corporate governance,
and market activity.

The platform is intended to operate like a digital forensic audit team.
Specialized AI and machine-learning agents investigate different
evidence types, while an Orchestrator Agent (Meta CIO) combines their
findings into a unified forensic risk report.

**Core product principle:** Abhimanyu identifies potential anomalies and
presents supporting evidence. It does not automatically declare a
company fraudulent or guarantee investment outcomes.

## 2. Problem Statement

Investors in the Indian stock market rely on company disclosures and
financial reports to assess listed companies. However, important warning
signs may be distributed across lengthy annual reports, auditor
observations, regulatory disclosures, financial statements, and
corporate relationship records.

The supplied project proposal identifies the following problems:

-   **Complex financial filings:** Annual reports can contain hundreds
    of pages of dense financial and legal information.
-   **Hidden corporate relationships:** Director and promoter
    connections across companies may be difficult to trace.
-   **Related-party transactions:** Circular or suspicious transactions
    may be buried in corporate disclosures.
-   **Accounting irregularities:** Potential earnings manipulation and
    cash-flow inconsistencies may not be obvious from headline financial
    figures.
-   **Market manipulation:** Abnormal trading activity and potential
    order-book spoofing can be difficult for retail investors to
    investigate.
-   **Information asymmetry:** Individual investors may lack the time
    and resources required for detailed forensic analysis.

Existing retail applications commonly emphasize price and market
indicators. The proposal identifies a gap for an automated investigation
platform that examines corporate disclosures and potential governance
failures.

## 3. Product Vision

Make institutional-style corporate financial investigation more
accessible to retail investors and analysts through explainable AI,
machine-learning analysis, document intelligence, and corporate
relationship mapping.

### Product goals

1.  Reduce the effort required to investigate complex corporate filings.
2.  Extract important auditor observations and financial disclosures
    from long documents.
3.  Identify potential accounting and market anomalies.
4.  Reveal relationships among directors, promoters, and corporate
    entities.
5.  Combine findings from specialized agents into a coherent forensic
    report.
6.  Make findings understandable and traceable to their underlying
    evidence.
7.  Support timely alerts when relevant high-priority findings become
    available.

## 4. Target Users

The proposal identifies retail investors and institutional analysts as
the primary audiences.

### 4.1 Retail investors

**Needs** - Quickly investigate a listed company. - Understand important
financial and auditor warning signs. - View a summarized forensic risk
assessment. - Receive alerts about relevant findings. - Review
previously retrieved reports.

### 4.2 Institutional analysts and forensic researchers

**Needs** - Inspect detailed financial and corporate evidence. - Explore
director and company relationship networks. - Review original
annual-report pages alongside extracted findings. - Compare agent
outputs and investigate conflicting indicators. - Access detailed
forensic reports for further review.

### 4.3 Project administrators and development team

This is an implementation/support role inferred from the need to operate
ingestion pipelines, background workers, databases, and model
integrations. The proposal does not define a separate administrator
product interface.

**Operational needs** - Monitor ingestion and investigation jobs. -
Configure data-source and model integrations. - Diagnose failed
processing tasks. - Maintain data quality and service reliability.

## 5. Product Scope

### 5.1 In scope

The initial product scope follows the supplied proposal:

-   NSE/BSE listed-company investigation.
-   Company/ticker lookup.
-   Annual-report and corporate-disclosure ingestion.
-   PDF text extraction and OCR for scanned documents.
-   AI-based extraction of auditor notes, annual-report information, and
    SEBI SAST disclosures.
-   Financial statement and accounting-indicator analysis.
-   Beneish M-Score calculation.
-   Potential order-book spoofing and unusual-volume analysis, subject
    to data availability.
-   Director DIN and corporate relationship mapping.
-   Related-party network investigation.
-   Sentiment-versus-reality analysis between MD&A tone and auditor
    notes.
-   Unified forensic risk reporting.
-   Web dashboard and Android/iOS mobile application, built from one
    Expo (React Native) codebase.
-   Mobile offline report caching.
-   Firebase Cloud Messaging push notifications.
-   Asynchronous processing for long-running investigations.

### 5.2 Out of scope

The following are not established as product goals in the supplied
proposal and should not be treated as committed features:

-   Guaranteed stock-price prediction.
-   Automated buy/sell recommendations.
-   Automated execution of stock trades.
-   Guaranteed detection or prevention of all fraud.
-   Definitive legal or regulatory conclusions.
-   Replacement of statutory auditors, SEBI, or professional financial
    advisers.
-   Unrestricted access to paid or restricted financial datasets.

## 6. Core Product Modules and Requirements

### 6.1 Company Search and Investigation

**Description:** Allow a user to initiate an investigation of an Indian
listed company using its ticker or company identity.

**Functional requirements** - The system shall accept a company/ticker
investigation request. - The system shall retrieve available company,
filing, and financial data associated with the selected entity. - The
system shall create an investigation job and expose its processing
status. - The system shall present the completed investigation report
when processing finishes. - The system shall distinguish unavailable
data from a negative finding.

**Expected output** - Company identity and ticker. - Investigation
status. - Available filing and data coverage. - Forensic risk report and
supporting indicators.

### 6.2 Corporate Filing and Annual-Report Intelligence

**Description:** Process public corporate disclosures and annual reports
to extract information relevant to forensic investigation.

**Functional requirements** - The system shall ingest available BSE/NSE
corporate announcements and XML/XBRL disclosures. - The system shall
process annual-report PDF documents. - The system shall extract embedded
PDF text and apply OCR to scanned pages. - The DocSynthesizer agent
shall identify relevant annual-report sections, auditor qualification
notes, and SEBI SAST disclosures. - The system shall structure extracted
information into machine-readable records. - The system shall preserve
source-document metadata and page references where available. - The
system shall make extracted passages available for evidence inspection.

**Key technologies in the proposal** - Python scraping and ingestion
tools. - BeautifulSoup, Selenium, and Playwright. - Tesseract OCR. -
LlamaIndex. - Gemini Flash.

### 6.3 Forensic Accounting Analysis

**Description:** Analyze financial statement information for potential
accounting irregularities.

**Functional requirements** - The system shall calculate the Beneish
M-Score when the required financial inputs are available. - The system
shall identify suspicious cash-flow-to-EBITDA divergence. - The system
shall examine unusual changes in relevant financial metrics. - The
system shall show the financial period and input values used for each
indicator. - The system shall explain why an indicator was raised. - The
system shall identify missing or insufficient input data rather than
silently estimating unavailable values.

**Expected output** - Beneish M-Score and its input components. -
Potential earnings-manipulation indicator. - Cash-flow and EBITDA
comparison. - Supporting financial periods and source records.

### 6.4 Market Microstructure and Anomaly Detection

**Description:** Analyze available Indian order-book and trading data
for potential spoofing and unusual market activity.

**Functional requirements** - The system shall ingest order-book data
when a permitted and reliable source is available. - The Microstructure
Fraud agent shall analyze available NSE Level 2/Level 3 order-book
data. - The system shall apply Isolation Forest and/or XGBoost-based
analysis as appropriate to the available data and labels. - The system
shall identify unusual order-book and volume patterns. - The system
shall associate detected anomalies with relevant time intervals and
available market context. - The system shall label results as potential
anomalies requiring investigation.

**Dependency:** This module depends on access to sufficiently detailed
and reliable order-book data. The proposal mentions NSE India endpoints
and session-based access; actual availability, permitted use, and access
conditions must be validated before implementation.

### 6.5 Promoter, Director, and Corporate Relationship Intelligence

**Description:** Build a relationship network to help identify
potentially undisclosed or suspicious connections among directors,
promoters, and companies.

**Functional requirements** - The system shall extract Director
Identification Numbers (DINs) from available filings. - The system shall
associate directors with companies using source-backed records. - The
system shall store entities and their relationships in a graph
database. - The system shall support queries across director and company
relationships. - The system shall highlight potential related-party
networks and circular relationship patterns. - The system shall preserve
the source and date associated with each relationship. - The system
shall avoid merging entities solely because their names are similar.

**Key technology:** Neo4j, with Memgraph identified as an alternative in
the proposal.

### 6.6 Sentiment-versus-Reality Analysis

**Description:** Compare management commentary with auditor observations
to identify possible inconsistencies.

**Functional requirements** - The system shall extract relevant MD&A
statements. - The system shall extract relevant auditor notes and
qualifications. - The system shall compare the two evidence sets. - The
system shall flag potentially material differences for analyst review. -
The system shall show the passages used to support each comparison.

The proposal identifies this as a core investigation area but does not
specify a finalized scoring formula or sentiment model. These details
require design and validation during implementation.

### 6.7 Multi-Agent Orchestration

**Description:** Coordinate specialist agents and aggregate their
outputs into a unified investigation.

**Functional requirements** - The system shall use a stateful workflow
orchestrator. - The DocSynthesizer shall focus on document understanding
and structured extraction. - The ML forensic capability shall focus on
numerical and market anomaly analysis. - The Network Graph Agent shall
investigate corporate relationships. - The Orchestrator Agent / Meta CIO
shall aggregate specialist findings. - The orchestrator shall handle
missing, incomplete, or conflicting agent outputs. - The final report
shall distinguish evidence, derived indicators, and model-generated
interpretations.

**Proposed technologies** - LangGraph. - LangChain. - Gemini Flash. -
Claude 3.5 or DeepSeek-R1 as proposed report-synthesis options.

The proposal presents these as technology options and roles; it does not
require every model provider to be used simultaneously.

### 6.8 Forensic Risk Report

**Description:** Present a unified, explainable view of investigation
findings.

**Functional requirements** - The report shall summarize the
investigated company and available data coverage. - The report shall
consolidate document, accounting, relationship, and market findings. -
Each material finding shall include its explanation and available
supporting evidence. - The report shall identify missing data and
analysis limitations. - The report shall distinguish a risk indicator
from a confirmed finding of wrongdoing. - The report shall be accessible
from the web dashboard and mobile application.

**Risk score note:** The proposal refers to a "Red Flag Score" and a
forensic risk score. The exact scoring scale, weighting, thresholds, and
calibration dataset are not specified. These must be defined and
validated before the score is presented as a calibrated measure.

### 6.9 Web Dashboard

**Description:** Provide an institutional-style portal for detailed
investigation and evidence inspection.

**Functional requirements** - Provide company/ticker lookup. - Display
investigation status and forensic findings. - Display risk indicators
and their explanations. - Render interactive director/company
relationship graphs. - Allow users to inspect graph nodes and
relationships. - Provide PDF viewing for annual reports. - Allow an
extracted finding to navigate to its relevant PDF passage where page and
coordinate information is available.

**Technologies** - Expo Router (web output of the shared Expo app). -
Shared design tokens. - Cytoscape.js (Expo DOM component). - PDF.js.

### 6.10 Mobile Application (Android / iOS)

**Description:** Provide a mobile monitoring experience for quick
lookups, reports, and alerts.

**Functional requirements** - Support company/ticker lookup. - Display
company risk summaries and high-priority flags. - Display available
investigation reports. - Cache previously retrieved reports locally for
offline access. - Receive relevant push notifications. - Keep UI state
and business logic separated (TanStack Query for server data, small
Zustand stores for UI state).

**Technologies** - Expo (React Native, same codebase as the web
dashboard). - TanStack Query. - Persisted cache (MMKV / AsyncStorage). -
expo-notifications (Firebase Cloud Messaging / APNs).

## 7. End-to-End User Workflow

1.  The user opens the web dashboard or mobile application.
2.  The user searches for or selects an Indian listed company.
3.  The backend validates the request and creates an investigation job.
4.  The data pipeline retrieves available filings, annual reports,
    financial information, and supported market data.
5.  Document processing extracts text and applies OCR where required.
6.  Specialist agents perform document, accounting, market, and
    relationship analysis according to available inputs.
7.  The LangGraph orchestrator aggregates the agent outputs.
8.  The system stores structured results and supporting evidence.
9.  The forensic report becomes available to the user.
10. The user reviews risk indicators and opens supporting filing
    passages or relationship graphs.
11. Where configured, relevant high-priority findings trigger a mobile
    push notification.

## 8. Data Requirements and Sources

The proposal identifies the following data sources and methods. Their
actual accessibility and permitted use must be verified during
implementation.

  -----------------------------------------------------------------------
  Data category           Proposed source         Intended use
  ----------------------- ----------------------- -----------------------
  Corporate announcements BSE/NSE public          Auditor resignations,
                          announcements and       board outcomes, SAST
                          XML/XBRL feeds          disclosures

  Annual reports          Public BSE/NSE PDF      Auditor notes, MD&A,
                          links                   notes to accounts

  Financial fundamentals  Screener.in and         Multi-year financial
                          yfinance for prototype  statements and ratios
                          research                

  Production financial    CMIE Prowess or         More comprehensive
  data                    Refinitiv               financial analysis,
                                                  subject to
                                                  access/licensing

  Director relationships  MCA-21 public portal    DIN extraction and
                          and company filings     company relationship
                                                  mapping

  Order-book data         NSE India endpoints,    Level 2/Level 3
                          subject to access       microstructure analysis
                          conditions              

  Regulatory disclosures  SEBI SAST and relevant  Corporate event and
                          public disclosures      ownership analysis
  -----------------------------------------------------------------------

### Data handling requirements

-   Store source URL or source identifier where available.
-   Store company identifier and relevant ticker.
-   Store filing date, financial period, and ingestion timestamp.
-   Preserve original documents or stable references to them where
    permitted.
-   Retain PDF page references for extracted evidence where possible.
-   Validate units, periods, identifiers, and missing values.
-   Track data freshness and ingestion failures.
-   Do not treat unavailable data as evidence that no risk exists.

## 9. Data and Storage Requirements

The proposal specifies three distinct backend data stores and a mobile
cache.

  -----------------------------------------------------------------------
  Store                               Responsibility
  ----------------------------------- -----------------------------------
  Supabase PostgreSQL                 Structured company, filing,
                                      financial, job, and report data

  Neo4j AuraDB Free or Memgraph       Director, promoter, company, and
                                      related-entity graph

  ChromaDB                            Semantic embeddings and retrieval
                                      of annual-report passages

  Persisted app cache                 Local mobile cache for previously
  (MMKV / AsyncStorage)               retrieved reports
  -----------------------------------------------------------------------

The proposal selects Hugging Face `all-MiniLM-L6-v2` for local text
embeddings using PyTorch.

## 10. Background Processing Requirements

Large annual reports and multi-agent investigations may take longer than
a normal API request.

**Requirements** - The API shall dispatch long-running work to
background execution. - The API shall not remain blocked while large
documents are processed. - The system shall persist job status. -
Workers shall update job status as processing progresses. - Failed jobs
shall expose a useful failure state for diagnosis. - The client shall be
able to retrieve job status and completed results.

**Proposed technologies:** Celery and Redis for background jobs; Python
`asyncio` for lighter asynchronous tasks.

## 11. Non-Functional Requirements

The proposal emphasizes a low-cost, responsive, evidence-oriented
architecture. The following requirements translate those goals into
implementation expectations.

### 11.1 Performance and responsiveness

-   Long-running document and agent workflows shall execute
    asynchronously.
-   The API shall return job status without waiting for full forensic
    processing.
-   The web interface shall communicate loading, processing, completion,
    and failure states.
-   Mobile clients shall be able to display cached reports when offline.

No numerical latency or throughput targets are specified in the
proposal; these should be established after measuring the prototype.

### 11.2 Explainability and traceability

-   Important findings shall include their underlying evidence where
    available.
-   Financial indicators shall identify their input periods and values.
-   Document findings shall reference source passages and pages where
    possible.
-   Relationship edges shall retain provenance.
-   AI-generated summaries shall be distinguishable from source facts
    and calculated metrics.

### 11.3 Reliability

-   Background processing status shall be persisted.
-   Data-ingestion failures shall be visible to the system operators.
-   Missing or stale data shall be identified in reports.
-   Agent failure shall not silently become a clean or low-risk result.

### 11.4 Security

-   API keys and database credentials shall be stored outside source
    control.
-   Backend services shall validate incoming requests.
-   Database access shall use appropriately scoped credentials.
-   User and investigation data shall be protected from unauthorized
    access.
-   Deployment secrets shall be used for hosted environments.

The proposal does not define a complete authentication, authorization,
encryption, or retention policy. These must be specified in the security
design.

### 11.5 Scalability

-   Separate API request handling from heavy background analysis.
-   Keep document processing and agent execution modular.
-   Use dedicated storage systems for relational, graph, and vector
    workloads.
-   Allow workers to be scaled independently where infrastructure
    permits.

### 11.6 Cost constraints

-   The initial implementation should prioritize open-source
    technologies and available free tiers.
-   Paid data providers and paid model tiers must remain optional until
    approved.
-   Free-tier capacity and terms must be verified before deployment.

## 12. Success Criteria and Evaluation

The supplied proposal does not define numerical product KPIs. The
following are proposed evaluation criteria to be agreed by the team
before final testing.

  -----------------------------------------------------------------------
  Area                                Evaluation criterion
  ----------------------------------- -----------------------------------
  Document ingestion                  Can the pipeline retrieve and
                                      process the selected sample
                                      filings?

  Extraction quality                  Are extracted auditor notes and
                                      financial facts faithful to the
                                      source documents?

  Evidence traceability               Can users navigate from a finding
                                      to its source passage?

  Accounting analysis                 Do Beneish M-Score calculations
                                      match independently checked
                                      calculations for test cases?

  Relationship mapping                Are DIN-to-director and
                                      director-to-company links supported
                                      by source records?

  Anomaly detection                   Are false positives and false
                                      negatives measured on a documented
                                      evaluation set?

  Agent orchestration                 Are missing and conflicting agent
                                      outputs handled transparently?

  Report usefulness                   Can a reviewer understand why each
                                      risk indicator was raised?

  Mobile experience                   Can users retrieve cached reports
                                      and receive configured
                                      notifications?

  System reliability                  Are job failures, retries, and
                                      processing states observable?
  -----------------------------------------------------------------------

Do not claim predictive accuracy or fraud-detection effectiveness until
it has been measured on a documented and appropriately validated
dataset.

## 13. MVP Definition

A practical MVP should prove the central forensic workflow before
attempting every proposed data source and real-time capability.

### MVP features

1.  Search for a limited set of Indian listed companies.
2.  Ingest a small, reproducible collection of public annual reports and
    disclosures.
3.  Extract PDF text and OCR scanned pages where needed.
4.  Use Gemini Flash and the document pipeline to extract auditor
    observations and selected financial facts.
5.  Store structured company, filing, and extracted data in PostgreSQL.
6.  Calculate Beneish M-Score for companies with sufficient input data.
7.  Create a basic Neo4j director/company relationship graph from
    verified sample records.
8.  Use LangGraph to aggregate available specialist outputs.
9.  Generate an evidence-backed forensic report.
10. Display the report in a basic web dashboard (Expo app, web build).

### Later phases

-   Expanded MCA-21 relationship coverage.
-   Sentiment-versus-reality analysis.
-   Order-book spoofing analysis after reliable data access is
    established.
-   More advanced interactive graph exploration.
-   PDF split-screen inspection with source highlighting.
-   Mobile release of the Expo app (Android APK / iOS).
-   Offline report cache and FCM push alerts.
-   Expanded data-provider integrations and production deployment.

This MVP sequence is a recommended delivery plan based on the proposal's
architecture; the proposal itself does not formally label these features
as MVP versus later phases.

## 14. Four-Member Team Responsibilities

The proposal defines the following four-member allocation.

  -----------------------------------------------------------------------
  Team member             Responsibility          Deliverables
  ----------------------- ----------------------- -----------------------
  Member 1 --- Frontend   Expo app (web + Android App state, mobile
  Lead                    / iOS)                  alerts, graph viewer,
                                                  PDF split reader

  Member 2 --- Data       BSE/NSE XBRL and MCA-21 Scrapers, DIN
  Pipelines & Scrapers    data ingestion          extraction, cleaning,
                                                  PostgreSQL population

  Member 3 --- Agentic AI Stateful agent          LangGraph workflow,
  & LangGraph             orchestrator and        Gemini integration,
                          DocSynthesizer          prompt engineering

  Member 4 --- ML Models  ML analysis and         Isolation Forest,
  & Graph DB              relationship database   Beneish M-Score, Neo4j
                                                  nodes and relationships
  -----------------------------------------------------------------------

All members should agree on API contracts, database schemas, source
identifiers, and shared data formats before parallel implementation.

## 15. Risks, Dependencies, and Open Questions

### 15.1 Data access and licensing

**Risk:** Public websites and endpoints may change, impose rate limits,
require sessions, or restrict automated access.

**Mitigation:** Validate each source's terms and technical availability.
Maintain source adapters and document ingestion failures. Obtain
appropriate access or licensing for production data.

### 15.2 Data completeness and quality

**Risk:** Financial filings may be incomplete, inconsistent, delayed, or
difficult to normalize.

**Mitigation:** Track source coverage, periods, missing fields, and
ingestion timestamps. Do not calculate indicators when required inputs
are unavailable.

### 15.3 False positives

**Risk:** Unusual financial or market behavior does not necessarily
indicate fraud.

**Mitigation:** Present flags as potential anomalies, include evidence
and explanations, and require human review.

### 15.4 Model limitations

**Risk:** LLMs can misread documents or generate unsupported
explanations; anomaly models depend on data quality and validation.

**Mitigation:** Preserve source passages, validate extracted figures,
separate calculated metrics from model interpretations, and evaluate
models using documented test data.

### 15.5 Order-book data dependency

**Risk:** The proposed spoofing analysis requires sufficiently detailed
and permitted Level 2/Level 3 data.

**Mitigation:** Treat this module as dependent on source validation. Do
not promise real-time spoofing detection until the required feed and
data quality are confirmed.

### 15.6 Risk-score calibration

**Risk:** A single score can create false confidence if weighting and
thresholds are not validated.

**Mitigation:** Define the score methodology, document weights, test
against reviewed cases, and show component indicators alongside any
aggregate score.

### 15.7 Open product decisions

The proposal does not fully specify: - User registration,
authentication, and role permissions. - Final forensic risk-score
formula and thresholds. - Exact data refresh frequency and alert
priority rules. - Exact retention policy for reports and source
documents. - Final choice between Cytoscape.js and Vis.js. - Final
choice between Neo4j and Memgraph. - Production model-provider selection
and cost limits. - Numerical performance and availability targets. -
Whether reports need export formats such as PDF or CSV.

These decisions should be recorded by the team before production
implementation.

## 16. Acceptance Criteria

The initial end-to-end prototype can be considered ready for
demonstration when:

-   A user can submit a supported company/ticker investigation.
-   The backend creates and tracks an investigation job.
-   At least one supported public filing can be ingested and processed.
-   The system can extract relevant document information and retain
    source references.
-   Beneish M-Score is calculated correctly for a test case with
    sufficient inputs.
-   A sample director/company relationship can be queried from the graph
    database with provenance.
-   LangGraph can aggregate available specialist outputs.
-   The generated report explains its risk indicators and identifies
    missing data.
-   The web dashboard can display the report and its supporting
    evidence.
-   Processing errors are visible and do not silently produce a clean
    report.

Order-book analysis, mobile push alerts, and full-scale source coverage
should be accepted separately when their data and infrastructure
dependencies are satisfied.

## 17. Disclaimer

Abhimanyu is a research and financial intelligence support platform. Its
outputs are automated risk indicators and investigative leads, not proof
of fraud, legal conclusions, or personalized investment advice.

All findings should be independently verified using original disclosures
and other authoritative evidence. The platform does not guarantee
stock-price predictions, investment returns, or prevention of financial
losses.

------------------------------------------------------------------------

## 18. Reference

This PRD is based on the supplied **Project_Proposal.pdf**, titled:

*BharatForensic AI --- Institutional-Grade Multi-Agent Forensic Tool for
the Indian Stock Market* (7 pages).

The proposal supplies the project problem, four target investigation
areas, multi-agent architecture, specialist roles, data/API strategy,
web/mobile application architecture (now one Expo app), backend
infrastructure,
and four-member task allocation. Product acceptance criteria, MVP
sequencing, and several operational requirements in this PRD are
implementation recommendations derived from that proposal and are
identified as such.
