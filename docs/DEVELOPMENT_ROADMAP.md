# Development Roadmap --- Abhimanyu

**Project:** Abhimanyu\
**Proposal title:** BharatForensic AI --- Institutional-Grade
Multi-Agent Forensic Tool for the Indian Stock Market\
**Document:** `docs/DEVELOPMENT_ROADMAP.md`\
**Team size:** 4 members\
**Primary scope:** Indian listed companies on NSE and BSE

------------------------------------------------------------------------

## 1. Roadmap Objective

This roadmap converts the supplied project proposal into an actionable
development sequence for a four-member CSE project team.

The proposed system combines:

-   A Flutter mobile application for quick ticker lookups, cached
    reports, and push alerts.
-   A Next.js web dashboard for detailed forensic investigation.
-   A FastAPI backend and asynchronous processing pipeline.
-   Data ingestion for financial statements, exchange announcements,
    annual reports, and director relationships.
-   Specialized document, machine-learning, accounting, and
    graph-analysis agents.
-   A LangGraph Orchestrator / Meta CIO that consolidates specialist
    outputs into a forensic report.

**Planning note:** The original proposal defines the architecture,
responsibilities, data sources, and intended features, but does not
specify calendar dates, sprint lengths, or a delivery deadline. The
week-by-week schedule below is a suggested team plan, not a timeline
stated in the proposal. Adjust it to the team's actual academic calendar
and availability.

## 2. Project Delivery Strategy

Build the platform in dependency order rather than attempting every
advanced feature simultaneously.

1.  Establish the repository, backend, databases, and team interfaces.
2.  Build reliable data ingestion and document storage.
3.  Implement the first document and accounting analysis paths.
4.  Build the graph relationship pipeline.
5.  Connect specialist agents through LangGraph.
6.  Deliver the web investigation dashboard and mobile monitoring app.
7.  Integrate alerts, test end-to-end workflows, and prepare the final
    demonstration.

The MVP should demonstrate a complete, traceable investigation for a
supported company, even if some advanced data feeds are not yet
available.

## 3. Four-Member Team Allocation

The following responsibilities are taken from the proposal's **CSE Group
Task Allocation (4-Member Strategy)**.

  ----------------------------------------------------------------------------
  Member            Proposal role     Primary ownership  Key deliverables
  ----------------- ----------------- ------------------ ---------------------
  Member 1          Frontend Lead     Flutter mobile app BLoC state, mobile
                                      and Next.js web    alerts UI, ticker
                                      dashboard          lookup,
                                                         Cytoscape.js/Vis.js
                                                         graph viewer, PDF.js
                                                         split reader

  Member 2          Data Pipelines &  BSE/NSE feeds and  Playwright and
                    Scrapers          MCA-21 data        BeautifulSoup
                                      collection         pipelines,
                                                         XBRL/announcement
                                                         ingestion, DIN
                                                         relationship
                                                         extraction,
                                                         PostgreSQL population

  Member 3          Agentic AI &      Stateful agent     LangGraph workflow,
                    LangGraph         orchestration and  DocSynthesizer,
                                      document           Gemini API prompt
                                      intelligence       pipeline, structured
                                                         agent outputs

  Member 4          ML Models & Graph Machine-learning   Isolation Forest on
                    DB                analysis and graph order-book ticks,
                                      storage            Beneish M-Score,
                                                         Neo4j nodes and
                                                         relationships
  ----------------------------------------------------------------------------

### 3.1 Shared responsibilities

All members should contribute to: - Agreeing API request/response
contracts before parallel implementation. - Reviewing the shared data
schema. - Maintaining setup instructions and environment examples. -
Testing integration points with sample data. - Recording known
limitations and unfinished features. - Preparing the final project
demonstration.

### 3.2 Ownership boundaries

-   Member 1 consumes documented backend APIs; frontend code should not
    implement scraping or financial calculations.
-   Member 2 owns source ingestion and raw/normalized data persistence;
    source retrieval status must be visible to downstream services.
-   Member 3 orchestrates agents and validates structured LLM outputs;
    it should not fabricate missing source evidence.
-   Member 4 owns model calculations and graph persistence; model
    outputs must include inputs, periods, and provenance.

These boundaries are recommended coordination rules to reduce duplicated
work.

------------------------------------------------------------------------

## 4. Suggested 8-Week Development Schedule

This is a suggested schedule for planning. It is not specified in the
source proposal.

### Week 1 --- Project Setup and Interface Agreements

**Goal:** Make the project runnable and allow all four members to work
in parallel.

**Member 1 --- Frontend** - Create the Next.js 14 App Router project. -
Create the Flutter application. - Establish shared design tokens and
basic navigation. - Build placeholder screens for company lookup,
dashboard, reports, graph, and alerts.

**Member 2 --- Data** - Inspect the intended BSE/NSE announcement and
XBRL sources. - Prototype retrieval of one public announcement and one
annual-report PDF. - Inspect MCA-21 filing availability for DIN
extraction. - Define raw-source metadata required for PostgreSQL.

**Member 3 --- Agentic AI** - Set up FastAPI integration expectations
with the team. - Create the initial LangGraph state definition. -
Prototype a Gemini Flash request. - Define a structured output contract
for DocSynthesizer.

**Member 4 --- ML and Graph** - Set up Neo4j locally or Neo4j AuraDB
Free. - Define initial company and director node structures. - Prototype
a Beneish M-Score calculation using a manually verified test dataset. -
Inspect the structure and availability of sample order-book data.

**Week 1 exit criteria** - Both frontend projects start locally. -
Backend and database setup instructions are agreed. - A sample source
document can be retrieved or supplied manually. - Initial API and data
contracts are documented. - Each member has a working development
environment.

### Week 2 --- Backend Foundation and Data Ingestion

**Goal:** Establish the first end-to-end data path.

**Member 1** - Build company search and company overview layouts. - Add
loading, empty, error, and unavailable-data states. - Connect to mock
API responses.

**Member 2** - Implement the first BSE/NSE announcement ingestion
pipeline. - Retrieve annual-report PDF links where available. - Build
initial MCA-21/DIN extraction prototype. - Store source records and
retrieval metadata in PostgreSQL.

**Member 3** - Implement FastAPI routes needed for investigation
requests and job status, in agreement with the team. - Define LangGraph
state fields for ticker, document results, accounting results, graph
results, and report status. - Build the initial DocSynthesizer prompt
and output validation.

**Member 4** - Create Neo4j company and director nodes. - Define
source-backed director-company relationships. - Implement a reusable
Beneish calculation module with explicit missing-input handling.

**Week 2 exit criteria** - At least one company/source record is
stored. - The backend can return company and source metadata. - A test
Beneish calculation can run from known inputs. - Neo4j can store and
query a sample director-company relationship.

### Week 3 --- Document Intelligence and Evidence Storage

**Goal:** Extract useful filing evidence with traceable page references.

**Member 1** - Build the report/evidence list UI. - Create the PDF.js
viewer layout. - Add a placeholder interaction to open a selected
document.

**Member 2** - Improve annual-report PDF retrieval and storage. - Record
document type, filing date, company, source, and retrieval timestamp. -
Add extraction status and source-failure handling.

**Member 3** - Implement DocSynthesizer processing using LlamaIndex and
Gemini Flash. - Extract auditor qualification notes, Notes to Accounts,
MD&A, and relevant SEBI SAST disclosures where present. - Validate
structured JSON and attach document/page references. - Preserve
OCR/native-text extraction metadata.

**Member 4** - Define the graph ingestion interface expected from Member
2. - Validate company/director identifiers before graph insertion. -
Review financial input mappings required by the Beneish calculation.

**Week 3 exit criteria** - A sample annual report can be processed. -
Extracted passages retain document and page references where
available. - Invalid LLM output is rejected or marked failed. - The web
UI can display a source-backed evidence item.

### Week 4 --- Forensic Accounting and Corporate Network

**Goal:** Deliver two core forensic analysis paths.

**Member 1** - Build the company forensic overview page. - Display
accounting indicators and relationship summary from API data. - Add
evidence navigation from a finding to its source document.

**Member 2** - Expand financial statement and disclosure ingestion. -
Populate normalized company/filing records in PostgreSQL. - Provide
director/DIN source records to Member 4.

**Member 3** - Add Forensic Accounting and Network Graph agent nodes to
the LangGraph workflow. - Define clear agent input/output contracts. -
Ensure the orchestrator distinguishes unavailable results from low-risk
results.

**Member 4** - Compute Beneish M-Score with stored input values and
formula version. - Build Neo4j director-company mapping from
source-backed DIN records. - Prototype related-party relationship
traversal. - Return graph paths with their source references.

**Week 4 exit criteria** - A supported company can produce a
reproducible Beneish result when sufficient data exists. - A
director-company graph can be queried. - A graph relationship is
traceable to its source record. - The frontend can display both types of
result.

### Week 5 --- Market Microstructure and Multi-Agent Orchestration

**Goal:** Integrate the proposal's market-data analysis path and the
Meta CIO workflow.

**Member 1** - Build a market-anomaly panel and timeline presentation. -
Add report sections for agent status, findings, evidence, and
limitations.

**Member 2** - Investigate permitted access and actual availability of
NSE L2/L3 order-book data. - Build a sample data ingestion path only
where the source is accessible and use is permitted. - Record feed
timestamps and missing intervals.

**Member 3** - Connect specialist outputs through LangGraph. - Implement
the Meta CIO synthesis step. - Preserve specialist findings and
conflicting outputs in the final report. - Validate generated reports
against a structured schema.

**Member 4** - Prepare order-book features from available ticks. - Train
or prototype Isolation Forest on an appropriate sample dataset. - Record
feature definitions, training period, and anomaly outputs. - Use XGBoost
only if defensible labelled examples are available; otherwise keep it as
an unvalidated/future component.

**Week 5 exit criteria** - LangGraph can run the available specialist
nodes and produce a consolidated report. - Missing agents or unavailable
data are explicitly reported. - Market anomaly analysis runs on a
documented sample dataset, if one is available. - No anomaly is
presented as confirmed spoofing or fraud.

### Week 6 --- Web Investigation Experience and Mobile App

**Goal:** Connect the main user interfaces to working backend services.

**Member 1** - Complete the Next.js analyst workflow. - Integrate
Cytoscape.js or Vis.js for interactive company/director relationships. -
Integrate PDF.js split-screen inspection and evidence navigation. -
Implement Flutter ticker lookup, cached report view using Hive, and BLoC
state handling.

**Member 2** - Stabilize ingestion status and source metadata APIs. -
Add retry/error states for failed retrievals. - Provide realistic sample
data for frontend integration tests.

**Member 3** - Stabilize investigation request and job-status
integration. - Improve prompt and output validation. - Add report
generation for partial results.

**Member 4** - Stabilize graph queries and financial calculation
responses. - Provide test graph datasets and calculation fixtures. -
Document model limitations and required data coverage.

**Week 6 exit criteria** - Web users can inspect a company report,
graph, and source document. - Mobile users can look up a company and
view a cached report. - Frontend states correctly represent loading,
partial, unavailable, and failed analysis.

### Week 7 --- Alerts, Integration Testing, and Reliability

**Goal:** Make the complete system behave consistently.

**Member 1** - Integrate Firebase Cloud Messaging (FCM) in Flutter. -
Implement notification navigation to the relevant company/report. - Test
offline cached report access.

**Member 2** - Test ingestion retries, duplicate handling, source
failures, and data freshness. - Verify source metadata is retained
through the pipeline.

**Member 3** - Test complete LangGraph runs and partial-failure
handling. - Ensure the Meta CIO does not invent missing values or erase
conflicting findings. - Record run status and relevant execution
metadata.

**Member 4** - Test Beneish calculations against known fixtures. - Test
Neo4j relationship queries and source traceability. - Evaluate Isolation
Forest output on held-out or separately selected sample data where
possible.

**Whole team** - Run end-to-end tests for at least one supported
company. - Fix integration defects. - Review security and secrets
handling. - Verify that report language distinguishes indicators from
confirmed facts.

**Week 7 exit criteria** - A complete investigation can be run and
inspected. - Mobile notification flow works in the test environment. -
Failures and missing data are visible. - Important outputs are
reproducible from recorded inputs and versions.

### Week 8 --- Final Validation and Demonstration

**Goal:** Prepare a reliable academic demonstration and handover.

**Member 1** - Polish responsive web and mobile layouts. - Prepare a
short user demonstration flow. - Verify graph and PDF evidence
navigation.

**Member 2** - Document data sources, ingestion steps, and source
limitations. - Prepare repeatable sample datasets and setup
instructions.

**Member 3** - Document agent responsibilities, LangGraph state, and
report-generation flow. - Prepare a demonstration of the specialist
agents and Meta CIO.

**Member 4** - Document Beneish calculation, graph model, and ML
experiment. - Prepare reproducible test inputs and outputs.

**Whole team** - Run a clean setup from the README. - Verify environment
variable documentation. - Check that no secrets are committed. - Prepare
architecture, methodology, and limitations slides. - Demonstrate one
end-to-end company investigation. - Clearly label prototype,
experimental, and unavailable capabilities.

**Week 8 exit criteria** - The project can be installed and run using
documented instructions. - The demo works from a clean test setup. - The
team can explain data sources, agent roles, and detection limitations. -
The final report includes evidence references and missing-data
disclosures.

------------------------------------------------------------------------

## 5. Milestones and Deliverables

  -----------------------------------------------------------------------
  Milestone               Expected deliverable    Depends on
  ----------------------- ----------------------- -----------------------
  M1 --- Foundation ready Frontend shells,        Team setup
                          FastAPI setup, database 
                          connections, shared     
                          contracts               

  M2 --- Data path ready  Company/source records, M1
                          announcement and PDF    
                          ingestion prototype     

  M3 --- Document         Extracted               M2
  intelligence ready      auditor/document        
                          findings with source    
                          references              

  M4 --- Accounting and   Beneish calculation and M2
  graph ready             DIN/company graph       
                          prototype               

  M5 --- Agent            LangGraph specialist    M3, M4
  orchestration ready     workflow and Meta CIO   
                          report                  

  M6 --- Interfaces       Web dashboard, graph    M1, M3--M5
  integrated              viewer, PDF inspector,  
                          Flutter lookup/cache    

  M7 --- Alerts and       FCM test, end-to-end    M6
  validation ready        tests, reliability      
                          checks                  

  M8 --- Final            Reproducible demo,      M7
  demonstration ready     documentation,          
                          limitations,            
                          presentation            
  -----------------------------------------------------------------------

## 6. Critical Dependencies

The following dependencies should be addressed early because they can
block later work.

### 6.1 Data availability

-   Financial calculations require consistent multi-year financial
    inputs.
-   Document intelligence requires retrievable annual reports and
    readable text or OCR.
-   DIN mapping requires usable company/director filing records.
-   Order-book anomaly analysis requires actual permitted L2/L3 data at
    sufficient granularity.

**Risk response:** Do not block the entire project on a difficult feed.
Use clearly labelled sample or manually supplied test data for a
prototype, and disclose that it is sample data. Do not present sample
results as live market findings.

### 6.2 Shared contracts

Before parallel integration, agree on: - Company identifier format. -
Investigation request format. - Job status values. - Agent output
structure. - Evidence reference structure. - Finding categories. - Error
and partial-result representation.

Keep these contracts aligned with `API_SPECIFICATION.md` and
`DATA_SCHEMA.md`.

### 6.3 Long-running analysis

The proposal identifies PDF processing as compute-heavy and recommends a
background Celery/Redis worker or Python asyncio task queue to avoid
HTTP request timeouts.

The team should expose job status to the frontend rather than requiring
a long synchronous HTTP request for a large PDF analysis.

### 6.4 Free-tier infrastructure

The proposal targets a zero-dollar student stack and mentions
Render/Railway free tiers or local hosting, Gemini/Groq API free tiers,
Neo4j AuraDB Free or Memgraph, Supabase PostgreSQL, and local ChromaDB.

Free-tier quotas and provider policies can change. Verify current limits
before deployment and retain a local development path.

------------------------------------------------------------------------

## 7. Testing Roadmap

### 7.1 Data pipeline tests

-   Source retrieval success and failure.
-   Duplicate announcement handling.
-   Invalid or incomplete PDF handling.
-   OCR/native-text extraction status.
-   DIN parsing and identifier validation.
-   Source metadata preservation.

### 7.2 Forensic calculation tests

-   Beneish calculation with known valid inputs.
-   Missing and zero-denominator input cases.
-   Unit and reporting-period consistency.
-   Reproducibility of calculated outputs.

### 7.3 Agent tests

-   Valid structured output.
-   Invalid JSON or missing required fields.
-   Empty retrieval results.
-   Conflicting specialist outputs.
-   Partial workflow failure.
-   Prompt-injection text inside retrieved documents.

### 7.4 Graph tests

-   Company and director node creation.
-   DIN-based relationship lookup.
-   Duplicate entity handling.
-   Relationship source provenance.
-   Graph path output and edge classification.

### 7.5 Frontend tests

-   Loading, empty, partial, error, and success states.
-   PDF evidence navigation.
-   Graph node inspection.
-   Mobile cached report behavior.
-   Push notification navigation.

### 7.6 End-to-end demonstration test

Use one selected company with a known set of test inputs and available
filings. Demonstrate:

1.  Company lookup.
2.  Source retrieval and document processing.
3.  At least one evidence-backed document finding.
4.  Beneish calculation if the required inputs are available.
5.  A source-backed director/company graph example if records are
    available.
6.  LangGraph aggregation.
7.  Final report display in the web dashboard.
8.  Mobile report lookup or notification flow.

If a module cannot run because its source data is unavailable,
demonstrate its explicit unavailable state rather than fabricating a
result.

------------------------------------------------------------------------

## 8. Definition of Done

A feature is considered complete only when:

-   [ ] Its owner has implemented it.
-   [ ] Its API/data contract is documented.
-   [ ] Success and failure states are handled.
-   [ ] Required source provenance is preserved.
-   [ ] A test or reproducible demonstration exists.
-   [ ] The feature is integrated with dependent modules.
-   [ ] Known limitations are documented.
-   [ ] No credentials or secrets are committed.
-   [ ] The README and relevant technical documents are updated.

A visually complete screen is not considered complete if it relies on
fabricated production data.

------------------------------------------------------------------------

## 9. Risks and Mitigation

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  MCA-21 or exchange      Data ingestion breaks   Isolate source
  source changes                                  adapters, log failures,
                                                  retain sample fixtures

  L2/L3 order-book data   Microstructure detector Confirm access early;
  unavailable             cannot be validated     use labelled sample
                                                  data only for prototype
                                                  experiments

  Incomplete financial    Beneish or cash-flow    Validate inputs and
  data                    analysis cannot run     return
                                                  `NOT_ENOUGH_DATA`

  LLM extraction errors   Incorrect document      Schema validation,
                          findings                source-page links,
                                                  analyst verification

  Long PDF processing     HTTP timeout            Background worker or
                                                  task queue with
                                                  job-status API

  Free-tier limits        Service interruption    Local fallback, quotas,
                                                  caching, controlled
                                                  test workload

  Team integration        Delayed delivery        Agree on API/schema
  conflicts                                       contracts early and
                                                  integrate continuously

  Overstated risk score   Misleading users        Explain components,
                                                  uncertainty, missing
                                                  coverage, and review
                                                  status
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 10. Final Demonstration Plan

The final demonstration should tell one coherent investigation story
rather than showing disconnected screens.

**Suggested sequence:**

1.  Open the web dashboard and search for a supported NSE/BSE company.
2.  Start an investigation.
3.  Show the retrieved company filings and data coverage.
4.  Open a processed annual report and inspect an extracted auditor
    note.
5.  Show the Beneish M-Score with its financial period and input
    provenance, if calculable.
6.  Open the corporate relationship graph and inspect a source-backed
    director/company link.
7.  Show market-microstructure results only if suitable order-book data
    is available.
8.  Show the Meta CIO report and how it combines specialist findings.
9.  Open the same company's report in the Flutter app.
10. Demonstrate a test push alert if FCM is configured.

Every displayed result should be marked as live-source, sample-data,
experimental, or unavailable as appropriate.

------------------------------------------------------------------------

## 11. Proposal Alignment

The roadmap is derived from the supplied seven-page
**Project_Proposal.pdf**, especially:

-   **Page 2:** Four investigation areas and the multi-agent
    architecture.
-   **Page 3:** Specialized agent roles and LangGraph orchestration
    example.
-   **Page 4:** BSE/NSE announcements, financial fundamentals, MCA-21
    director network, annual reports, and vector/graph storage.
-   **Page 5:** Flutter mobile app, BLoC, Hive, FCM, Next.js dashboard,
    Cytoscape.js/Vis.js, and PDF.js.
-   **Page 6:** FastAPI/Uvicorn, LangGraph/LangChain, Gemini/Groq,
    MiniLM, Neo4j/Memgraph, Supabase PostgreSQL, ChromaDB, and
    asynchronous processing.
-   **Page 7:** Task-to-source mapping and the exact four-member team
    allocation.

The proposal defines the four member roles but does not assign personal
names. Keep the member labels in this file until the team confirms who
owns each role.

## 12. Related Project Documents

Keep this roadmap synchronized with:

-   `PRD.md` --- product scope and requirements.
-   `Tech_Stack.md` --- selected technologies and alternatives.
-   `ARCHITECTURE.md` --- component and service architecture.
-   `API_SPECIFICATION.md` --- frontend/backend and service contracts.
-   `DATA_SCHEMA.md` --- relational, graph, and evidence structures.
-   `FRAUD_DETECTION_METHODOLOGY.md` --- detection logic and
    limitations.
-   `KNOWLEDGE_BASE.md` --- domain and project knowledge.
-   `SECURITY.md` --- security requirements.
-   `UI_UX_GUIDELINES.md` --- interface behavior and design rules.
-   `CHANGELOG.md` --- material implementation and decision changes.

Update the roadmap when responsibilities, dependencies, or delivery
scope change.
