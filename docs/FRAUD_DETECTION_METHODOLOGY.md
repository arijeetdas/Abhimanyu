# Fraud Detection Methodology --- Abhimanyu

**Project:** Abhimanyu\
**Proposal title:** BharatForensic AI --- Institutional-Grade
Multi-Agent Forensic Tool for the Indian Stock Market\
**Document:** `docs/FRAUD_DETECTION_METHODOLOGY.md`\
**Primary market scope:** Indian listed entities on NSE and BSE\
**Purpose:** Define how Abhimanyu identifies, evaluates, explains, and
reports potential financial, disclosure, governance,
relationship-network, and market-microstructure anomalies.

> **Methodology status:** The supplied project proposal identifies the
> investigation areas, specialist agents, and selected methods. It does
> not provide validated model thresholds, a labelled fraud dataset, a
> complete Red Flag Score formula, or detailed definitions for every
> detector. This document preserves those boundaries. Sections labelled
> **Proposed implementation design** are recommendations for the
> development team and must be validated before production use.

------------------------------------------------------------------------

## 1. Fundamental Principles

Abhimanyu is a forensic research-support platform, not a stock-price
prediction engine.

The platform is intended to identify patterns that deserve further
examination by combining:

1.  Document intelligence over annual reports and regulatory
    disclosures.
2.  Accounting-based financial indicators and numerical anomaly
    detection.
3.  Corporate relationship analysis using director and company records.
4.  Market-microstructure analysis using NSE Level 2 / Level 3
    order-book data, where legitimately available.
5.  An orchestration agent that consolidates specialist findings into an
    explainable forensic report.

### 1.1 What a detection means

A detection means that a defined rule, metric, model, or
document-analysis process found an observation worth reviewing.

A detection does **not**, by itself, establish: - Fraud. - Intentional
financial misstatement. - Market manipulation. - A criminal offence. - A
regulatory violation. - A guaranteed future stock-price movement.

Use language such as **potential anomaly**, **indicator**, **flagged for
review**, and **requires verification**.

### 1.2 Evidence-first requirements

Every finding should retain, where applicable:

-   Company identifier and ticker.
-   Investigation identifier.
-   Finding category and detector name.
-   Relevant financial period or event time.
-   Input values and calculation details.
-   Data source and retrieval timestamp.
-   Filing/document identifier and page reference.
-   Model, rule, or methodology version.
-   Data-quality limitations.
-   Supporting evidence references.
-   Review status.

A generated explanation must never replace the underlying evidence.

------------------------------------------------------------------------

## 2. Detection Architecture

The proposal defines the following specialist-agent architecture.

  -----------------------------------------------------------------------
  Specialist              Proposal technology     Main responsibility
  ----------------------- ----------------------- -----------------------
  DocSynthesizer (GenAI)  LlamaIndex, Gemini      Parse annual reports,
                          Flash                   auditor qualification
                                                  notes, and SEBI SAST
                                                  disclosures into
                                                  structured JSON

  Microstructure Fraud    XGBoost, Isolation      Analyze NSE L2/L3
  (ML)                    Forest                  order-book data for
                                                  spoofing and sudden
                                                  volume anomalies before
                                                  corporate announcements

  Forensic Accounting     Beneish M-Score, Python Calculate
  (ML)                                            earnings-manipulation
                                                  risk indicators and
                                                  flag suspicious
                                                  cash-flow-to-EBITDA
                                                  divergences

  Network Graph (Agentic) Neo4j, LangGraph        Map director DINs
                                                  across MCA filings and
                                                  identify potential
                                                  related-party networks
                                                  and circular trading

  Chief Investment        Claude 3.5 /            Aggregate signals,
  Officer / Meta CIO      DeepSeek-R1             resolve conflicting
                                                  metrics, and generate a
                                                  SEBI-style forensic
                                                  risk report
  -----------------------------------------------------------------------

The proposal also describes an Orchestrator Agent coordinating the
specialist agents.

### 2.1 High-level workflow

1.  Receive a supported company ticker or investigation request.
2.  Resolve the company identity and available source coverage.
3.  Retrieve financial statements, annual reports, announcements, and
    director/company records.
4.  Run the relevant specialist analyses.
5.  Store structured outputs and source evidence.
6.  Pass validated specialist results to the Meta CIO.
7.  Generate an explainable report, including missing data and
    limitations.

The proposal's sample LangGraph state includes `ticker`, `m_score`,
`related_party_network`, and `forensic_risk_score`. This is illustrative
and should be extended to retain all specialist outputs and provenance.

------------------------------------------------------------------------

## 3. Detection Category A --- Forensic Accounting

### 3.1 Beneish M-Score

**Proposal requirement:** The Forensic Accounting agent calculates the
Beneish M-Score to assess possible earnings-manipulation risk.

The score is an accounting-based screening indicator. It should be
calculated from comparable financial-statement periods and should not be
interpreted as proof of manipulation.

#### 3.1.1 Proposed implementation reference

The commonly used eight-variable Beneish M-Score formulation is:

\[ M = -4.84 + 0.920(DSRI) + 0.528(GMI) + 0.404(AQI) + 0.892(SGI) +
0.115(DEPI) - 0.172(SGAI) + 4.679(TATA) - 0.327(LVGI) \]

**Important:** This formula is a standard implementation reference added
to make the proposed indicator implementable; the supplied project
proposal names the Beneish M-Score but does not print its formula. The
team must confirm the exact formulation and accounting definitions
selected for the project, and document any adaptations.

#### 3.1.2 Variables

Let (t) represent the current financial year and (t-1) the preceding
financial year.

  -----------------------------------------------------------------------
  Variable                Meaning                 Common calculation
                                                  structure
  ----------------------- ----------------------- -----------------------
  DSRI                    Days' Sales in          (Net receivables /
                          Receivables Index       Sales)(*t) divided by
                                                  (Net receivables /
                                                  Sales)(*{t-1})

  GMI                     Gross Margin Index      Gross margin(\_{t-1})
                                                  divided by Gross
                                                  margin(\_t)

  AQI                     Asset Quality Index     (1 − \[Current assets +
                                                  PPE + securities\] /
                                                  Total assets)(\_t),
                                                  divided by the same
                                                  ratio for (t-1)

  SGI                     Sales Growth Index      Sales(*t) /
                                                  Sales(*{t-1})

  DEPI                    Depreciation Index      Depreciation
                                                  rate(\_{t-1}) /
                                                  Depreciation rate(\_t)

  SGAI                    SG&A Expense Index      (SG&A / Sales)(*t)
                                                  divided by (SG&A /
                                                  Sales)(*{t-1})

  TATA                    Total Accruals to Total (Income from continuing
                          Assets                  operations − Cash flow
                                                  from operations) /
                                                  Average or specified
                                                  total assets, according
                                                  to the chosen
                                                  formulation

  LVGI                    Leverage Index          Leverage(*t) /
                                                  Leverage(*{t-1}), using
                                                  a consistently defined
                                                  leverage measure
  -----------------------------------------------------------------------

The precise accounting definitions, denominator choices, and treatment
of exceptional items must be fixed in the implementation specification.
Do not mix definitions across companies or years without documenting the
change.

#### 3.1.3 Input requirements

At minimum, the calculation requires consistent financial-statement
values for two comparable periods, including relevant items such as:

-   Net sales / revenue.
-   Net receivables.
-   Cost of goods sold or corresponding gross-margin inputs.
-   Current assets.
-   Property, plant and equipment.
-   Relevant securities or other asset-quality inputs.
-   Total assets.
-   Depreciation and amortization inputs.
-   Selling, general and administrative expenses.
-   Income from continuing operations.
-   Cash flow from operations.
-   Debt and leverage inputs.

The exact field mapping must be documented for the selected Indian
financial-data source.

#### 3.1.4 Calculation safeguards

-   Confirm that both periods use compatible accounting periods and
    units.
-   Normalize currency units before calculation.
-   Check for zero or negative denominators.
-   Do not silently substitute missing values with zero.
-   Identify restated financial statements and record which version was
    used.
-   Preserve raw source values and normalized values.
-   Record formula version and calculation timestamp.
-   Return `not_calculable` when required inputs are missing or invalid.
-   Flag unusual input combinations for manual review rather than
    forcing a score.

#### 3.1.5 Interpretation

The M-Score should be displayed with: - Calculated value. - Financial
periods compared. - Input values. - Component indices. - Formula
version. - Source references. - Missing-input or data-quality notes. - A
cautious interpretation label based on the project's documented
methodology.

Do not present a threshold as a project-approved fraud boundary until
the team has selected, documented, and validated it. An M-Score is a
screening signal, not a fraud verdict.

### 3.2 Cash-Flow-to-EBITDA Divergence

**Proposal requirement:** Flag suspicious divergence between cash flow
and EBITDA.

The proposal does not specify the exact formula, acceptable range,
comparison period, or alert threshold. These must be established by the
team.

#### 3.2.1 Proposed implementation design

For each comparable reporting period, collect: - Cash flow from
operating activities (CFO). - EBITDA. - Revenue, if required for
normalization. - Relevant working-capital movements. - Financial period
and statement source.

A simple diagnostic ratio that the team may evaluate is:

\[ CFO`\text{-}`{=tex}to`\text{-}`{=tex}EBITDA =
`\frac{CFO}{EBITDA}`{=tex} \]

This ratio is only a candidate diagnostic, not a formula prescribed by
the proposal. It can be misleading when EBITDA is zero or negative, or
when accounting classifications differ.

A second diagnostic may compare normalized operating cash flow and
EBITDA over multiple periods. The exact calculation should be selected
only after reviewing the financial data schema and accounting treatment.

#### 3.2.2 Review logic

Investigate: - Persistent divergence across multiple periods. - EBITDA
growth without corresponding operating cash generation. - Material
working-capital changes. - Large receivables movements. - One-off or
classification effects. - Restatements or changes in reporting basis.

Do not automatically classify divergence as manipulation. The report
must show the values, periods, calculation, and source statements.

### 3.3 Revenue and Earnings Anomalies

The proposal includes revenue and earnings anomalies within the
ML/forensic scope but does not define a complete detector.

**Proposed implementation design:** - Compare multi-period revenue,
profit, margins, receivables, and operating cash flow. - Identify
unusual changes relative to the company's own history. - Compare peer
groups only when peer selection and accounting comparability are
defensible. - Record the exact features and periods used. - Route
unusual observations to analyst review.

Do not train a supervised fraud classifier until the team has a reliable
labelled dataset and a documented label definition.

------------------------------------------------------------------------

## 4. Detection Category B --- Market Microstructure

### 4.1 Order-Book Spoofing and Unusual Volume

**Proposal requirement:** The Microstructure Fraud agent uses XGBoost
and Isolation Forest to analyze NSE Level 2 / Level 3 order-book data
for spoofing and sudden volume anomalies, including activity before
corporate announcements.

The proposal does not define a complete spoofing rule, labelled dataset,
model features, or validated threshold.

#### 4.1.1 Data requirements

Where legitimately available and permitted by the data provider,
capture:

-   Instrument identifier.
-   Exchange and trading session.
-   Event timestamp with timezone.
-   Order-book level.
-   Bid and ask prices.
-   Displayed bid and ask quantities.
-   Order additions, modifications, and cancellations where available.
-   Executed trades and trade quantities where available.
-   Relevant corporate-announcement timestamps.
-   Data-source and feed-quality metadata.

The system must distinguish actual order-level event data from
snapshots. A snapshot-only feed may not support conclusions about order
cancellations or intent.

#### 4.1.2 Proposed feature engineering

Candidate features for research and validation include:

  -----------------------------------------------------------------------
  Feature                             Description
  ----------------------------------- -----------------------------------
  Bid-ask spread                      Difference between best ask and
                                      best bid

  Depth imbalance                     Relative difference between
                                      bid-side and ask-side displayed
                                      depth

  Depth changes                       Changes in displayed quantity
                                      across time

  Cancellation intensity              Cancellation activity relative to
                                      additions, where event data exists

  Order lifetime                      Time between order placement and
                                      cancellation, where order
                                      identifiers exist

  Trade-to-display ratio              Executed quantity compared with
                                      displayed quantity

  Volume surprise                     Current volume relative to a
                                      defined historical baseline

  Price movement                      Price changes over defined event
                                      windows

  Announcement proximity              Time difference between market
                                      events and a relevant corporate
                                      announcement
  -----------------------------------------------------------------------

These are candidate features, not a validated spoofing definition.
Feature availability depends on the feed's granularity and permitted
use.

#### 4.1.3 Isolation Forest

The proposal selects Isolation Forest for order-book anomaly detection.

Recommended use: 1. Build a clean feature dataset from valid market
observations. 2. Separate instruments and market-session conditions
where necessary. 3. Fit the model on a documented reference period. 4.
Generate anomaly scores for new observations. 5. Review the most
anomalous observations with their underlying event windows. 6. Store
model version, feature version, training period, and score.

Isolation Forest identifies observations that differ from the learned
data distribution. It does not determine that an event is spoofing or
that a trader intended to mislead the market.

#### 4.1.4 XGBoost

The proposal lists XGBoost for the Microstructure Fraud agent.

Recommended use: - Use supervised classification only when the team has
defensible labels. - Document how positive and negative examples were
labelled. - Avoid treating unverified anomaly scores as ground-truth
labels. - Split training and evaluation data chronologically to reduce
future-data leakage. - Evaluate precision, recall, F1, PR-AUC, and
false-positive rates. - Calibrate predicted probabilities before
presenting them as probabilities.

If reliable labels are unavailable, use XGBoost only for a clearly
documented experimental task; do not claim validated spoofing
classification.

#### 4.1.5 Event-window analysis

The proposal specifically mentions anomalies before corporate
announcements.

A recommended research workflow is: 1. Record the authoritative
announcement timestamp. 2. Define pre-announcement and comparison
windows in advance. 3. Analyze order-book and volume features in those
windows. 4. Compare with suitable historical baseline periods. 5. Record
missing feed intervals and market-session effects. 6. Present the
pattern and timeline for human review.

Do not infer insider knowledge or manipulation solely from temporal
proximity to an announcement.

### 4.2 Market Data Quality Controls

-   Validate timestamps, exchange sessions, and instrument identifiers.
-   Detect duplicate, missing, delayed, and out-of-order events.
-   Preserve original event timestamps.
-   Do not combine feeds with incompatible granularity without
    documenting the transformation.
-   Mark results unavailable when the feed is incomplete.
-   Respect exchange/provider licensing and access rules.
-   Do not bypass technical restrictions or rate limits.

------------------------------------------------------------------------

## 5. Detection Category C --- Document Intelligence and Sentiment vs. Reality

### 5.1 DocSynthesizer

**Proposal requirement:** Use LlamaIndex and Gemini Flash to parse PDF
annual reports, auditor qualification notes, and SEBI SAST disclosures
into structured JSON.

The document agent should focus on extracting relevant passages and
structured evidence, not independently declaring fraud.

### 5.2 Target document sections

The proposal specifically highlights: - Annual reports. - Auditor
qualification notes. - Notes to Accounts. - Management Discussion and
Analysis (MD&A). - SEBI SAST disclosures. - BSE/NSE corporate
announcements.

### 5.3 Document-processing methodology

1.  Retrieve the original filing or annual-report PDF.
2.  Record source, filing date, retrieval time, and company identity.
3.  Extract native PDF text where possible.
4.  Use Tesseract OCR for scanned/image-based pages.
5.  Preserve page references and extraction method.
6.  Use the selected LLM pipeline to identify relevant sections and
    structured fields.
7.  Validate structured output against a schema.
8.  Store extracted passages with document and page provenance.
9.  Make the original source available for analyst verification.

### 5.4 Sentiment vs. Reality

**Proposal requirement:** Compare MD&A tone against auditor notes.

Proposed analysis: - Extract management statements and forward-looking
commentary. - Extract auditor qualifications, emphasis, observations,
and relevant warnings. - Identify topic-level differences or potentially
conflicting statements. - Retrieve the original passages on both
sides. - Explain why the passages were paired for review.

The proposal does not define a sentiment model, contradiction taxonomy,
or scoring threshold.

**Proposed implementation design:** Use semantic retrieval and
structured comparison to identify passages concerning the same topic,
financial period, or business assertion. Ask the model to explain the
textual difference and quote short source-grounded excerpts. Require
analyst verification before treating a mismatch as a material
contradiction.

A positive management tone and a qualified audit opinion may coexist for
legitimate reasons. Tone difference alone is not proof of deception.

### 5.5 Structured output

A recommended document finding should include:

-   `company_id`
-   `document_id`
-   `document_type`
-   `filing_date`
-   `financial_period`
-   `section_name`
-   `page_number`
-   `extracted_text`
-   `finding_category`
-   `finding_summary`
-   `source_reference`
-   `extraction_method`
-   `model_name`
-   `model_version`
-   `review_status`

This is a proposed logical output structure; align it with
`DATA_SCHEMA.md`.

------------------------------------------------------------------------

## 6. Detection Category D --- Corporate Relationship and RPT Networks

### 6.1 Related Party Transactions

**Proposal requirement:** Identify potential Related Party Transaction
(RPT) circular loops through MCA-21 filings and corporate relationship
mapping.

The proposal emphasizes extracting Director Identification Numbers
(DINs), mapping director-company links, and using Neo4j to highlight
relationships between listed and unlisted companies.

### 6.2 Entity and relationship ingestion

Recommended entities: - Company. - Director/person. - Listed company. -
Unlisted company. - Disclosed related party, where source data
identifies it. - Filing or source record.

Recommended relationships: - `DIRECTOR_OF` -
`DISCLOSED_RELATED_PARTY_OF` - `TRANSACTED_WITH` - Other explicitly
supported relationship types defined by the data model.

These are suggested graph labels/relationships, not a complete list
prescribed by the proposal.

### 6.3 DIN-based mapping

1.  Extract DINs from relevant company filings.
2.  Normalize and validate identifiers.
3.  Resolve company identifiers and names.
4.  Create or update graph nodes.
5.  Connect directors to companies using source-backed records.
6.  Retain filing reference, date, and relationship provenance.
7.  Query connected entities for analyst review.

A shared director is a corporate connection, not evidence of a
suspicious transaction.

### 6.4 Potential circular trading / transaction paths

The proposal calls for identifying hidden related-party networks and
circular trading.

**Proposed implementation design:** - Start with disclosed transactions
and source-backed company relationships. - Search for paths connecting
entities through documented relationships and transaction records. -
Record path length, entity sequence, relationship types, source records,
and relevant dates. - Distinguish a path made entirely of disclosed
facts from one containing inferred edges. - Require transaction evidence
before describing a path as a circular transaction.

A graph cycle alone does not establish circular trading, shell-company
activity, or misconduct.

### 6.5 Relationship confidence and provenance

Each edge should be classified, at minimum, as one of: - Directly
disclosed / source-backed. - Derived through deterministic identifier
matching. - Inferred by an analytical process. - Unverified / requiring
review.

The system should not merge entities solely because their names are
similar. Use stable identifiers where available and retain
entity-resolution decisions.

------------------------------------------------------------------------

## 7. Promoter Pledge Anomalies and Group-Entity Obfuscation

**Proposal requirement:** Investigate promoter pledge anomalies and
promoter-group entity obfuscation.

The proposal identifies this as a target area but does not define: -
Required pledge fields. - A pledge-change formula. - A detection
threshold. - A historical comparison window. - A validated labelled
dataset.

### 7.1 Proposed implementation design

Subject to source availability, collect: - Promoter/shareholder
identifier. - Shares held. - Shares pledged or encumbered. - Pledge
percentage and its denominator. - Disclosure date. - Effective period,
where supplied. - Company and filing identifiers. - Source reference.

Potential review signals: - Material changes in disclosed pledged
shares. - Changes in pledge percentage over time. - Inconsistent or
incomplete disclosures. - Differences between successive filings. -
Complex group relationships that require additional verification.

The team must define the denominator and treatment of changes in
shareholding before comparing percentages. Do not infer hidden ownership
or intentional obfuscation from missing records alone.

------------------------------------------------------------------------

## 8. Multi-Agent Aggregation and Forensic Risk Report

### 8.1 Meta CIO responsibility

The proposal assigns the Chief Investment Officer / Meta CIO the
responsibility to: - Aggregate specialist-agent signals. - Resolve
conflicting metrics. - Generate a SEBI-style forensic risk report.

The sample LangGraph workflow shows the Meta CIO synthesizing the
Beneish M-Score and related-party network output into a
`forensic_risk_score`.

### 8.2 Recommended aggregation rules

-   Preserve the original specialist result.
-   Keep each finding linked to its source evidence.
-   Do not allow a narrative model to invent missing numerical values.
-   Distinguish unavailable results from low-risk results.
-   Surface conflicts between specialist agents.
-   Explain which signals contributed to the report.
-   Record model and prompt versions where practical.
-   Keep report generation separate from the underlying calculation
    pipeline.

### 8.3 Red Flag Score

The proposal refers to a unified **Red Flag Score** /
`forensic_risk_score`, but does not define: - Scale or range. -
Component weights. - Severity thresholds. - Calibration method. -
Training or validation dataset. - How missing modules affect the score.

Therefore, no numeric scoring formula is prescribed by this document.

**Recommended MVP behavior:** Display a findings summary grouped by
category and priority. If the team builds an experimental aggregate
score, label it experimental, show its component signals and coverage,
and do not present it as a probability of fraud.

### 8.4 Conflicting evidence

When agents disagree: 1. Preserve each agent's output. 2. Identify the
exact conflicting inputs or conclusions. 3. Check data periods,
definitions, and source quality. 4. Mark the conflict in the report. 5.
Request analyst review where necessary.

The Meta CIO must not silently discard a conflicting result.

------------------------------------------------------------------------

## 9. Model Training, Testing, and Evaluation

The proposal names XGBoost and Isolation Forest but does not supply a
fraud-labelled dataset or validation results.

### 9.1 Dataset preparation

For each dataset, document: - Source and license/access basis. -
Collection period. - Entity and instrument coverage. - Feature
definitions. - Label definition, if supervised. - Missing-value
treatment. - Duplicate handling. - Data-quality checks. - Training and
test periods.

### 9.2 Avoid data leakage

-   Split time-series and market-event data chronologically.
-   Do not use information that became available after the detection
    timestamp.
-   Keep data from the same event from leaking across training and test
    sets.
-   Fit scalers, imputers, and feature transformations on training data
    only.
-   Record point-in-time availability for financial filings and
    announcements.

### 9.3 Evaluation metrics

For supervised classifiers, report: - Precision. - Recall. - F1-score. -
PR-AUC, especially where positive cases are rare. - Confusion matrix. -
False-positive rate. - Performance by time period and relevant data
segment.

For anomaly detection, report: - Expert review rate of top-ranked
anomalies. - Stability across time periods. - Duplicate/near-duplicate
alert rate. - Analyst-confirmed usefulness, where review labels exist. -
Sensitivity to feature and parameter changes.

Do not claim model accuracy without a documented test set and
reproducible evaluation.

### 9.4 Human review

For a student prototype, the analyst or evaluator should be able to
inspect: - Why the record was flagged. - Which features or passages
contributed. - The relevant source data. - Known limitations. - Whether
the finding was reviewed and what the review outcome was.

Human review labels must be recorded separately from model predictions.

------------------------------------------------------------------------

## 10. Unified Finding Lifecycle

Recommended lifecycle:

1.  **Detected** --- a rule, model, or document process creates a
    candidate finding.
2.  **Evidence attached** --- source records and calculation details are
    linked.
3.  **Validated technically** --- schema, source, period, and
    data-quality checks pass.
4.  **Needs review** --- an analyst should inspect the finding.
5.  **Reviewed** --- an authorized reviewer records an assessment.
6.  **Resolved / dismissed / escalated** --- the finding receives a
    documented outcome.

Do not overwrite the original model output when a reviewer changes the
status. Preserve both the machine result and the review history.

------------------------------------------------------------------------

## 11. Data Sources and Availability

The proposal identifies the following sources and intended uses:

  ------------------------------------------------------------------------
  Source                  Intended data           Method mentioned in
                                                  proposal
  ----------------------- ----------------------- ------------------------
  BSE corporate           Auditor resignations,   Python scrapers,
  announcements           board meeting outcomes, XML/XBRL feeds,
                          SAST disclosures        BeautifulSoup/Selenium

  NSE corporate           Corporate disclosures   Exchange announcements
  announcements           and annual-report links and feeds

  Screener.in             Prototype financial     Scraping, subject to
                          fundamentals            access terms

  yfinance                Prototype financial     Python library
                          data                    

  CMIE Prowess            Potential production    Institutional
                          financial data          integration, subject to
                                                  access/licensing

  Refinitiv               Potential production    Institutional
                          financial data          integration, subject to
                                                  access/licensing

  MCA-21                  DIN and                 Public portal/company
                          director-company        filings; Playwright
                          relationships           mentioned

  NSE order-book data     L2/L3 market ticks      NSE endpoints, subject
                                                  to access and terms

  BSE/NSE annual-report   Annual reports and      PDF extraction and
  PDFs                    auditor notes           Tesseract OCR

  SEBI-related            SAST and relevant       Public
  disclosures             public disclosures      regulatory/corporate
                                                  disclosures
  ------------------------------------------------------------------------

### 11.1 Source controls

-   Verify the source's terms and permitted use.
-   Respect rate limits and access controls.
-   Do not treat a failed retrieval as an absence of an event.
-   Record retrieval time and source identifiers.
-   Distinguish prototype data from production-grade licensed data.
-   Validate yfinance coverage before relying on it for Indian-market
    calculations.
-   Do not assume L2/L3 order-book data is freely or consistently
    available.

The proposal's mention of dynamic headers or session cookies is not
permission to bypass access restrictions. Use permitted access methods
only.

------------------------------------------------------------------------

## 12. Required Output Format

A recommended common finding structure for all agents:

``` json
{
  "finding_id": "unique-id",
  "company_id": "company-id",
  "ticker": "EXAMPLE",
  "category": "FORENSIC_ACCOUNTING",
  "detector": "BENEISH_M_SCORE",
  "title": "Potential earnings-manipulation indicator",
  "summary": "A screening indicator requires further review.",
  "status": "NEEDS_REVIEW",
  "period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "result": {
    "value": null,
    "unit": null,
    "interpretation": "Not calculated"
  },
  "inputs": [],
  "evidence": [],
  "source_references": [],
  "methodology_version": "1.0",
  "model_version": null,
  "limitations": [],
  "created_at": "ISO-8601 timestamp"
}
```

This is a proposed API/data contract example, not a schema supplied by
the proposal. Align it with `DATA_SCHEMA.md` and `API_SPECIFICATION.md`.
Do not use placeholder values as actual findings.

### 12.1 Required evidence object

A recommended evidence reference includes: - Source name. - Source URL
or source ID. - Filing/document ID. - Filing date. - Retrieval
timestamp. - Page/section or event timestamp. - Extracted passage or
relevant data fields. - Extraction method. - Original file reference,
where retained.

------------------------------------------------------------------------

## 13. Failure and Missing-Data Handling

The detector must return an explicit state instead of manufacturing a
result.

Recommended states: - `COMPLETED` - `PARTIAL` - `NOT_ENOUGH_DATA` -
`SOURCE_UNAVAILABLE` - `INVALID_INPUT` - `PROCESSING_FAILED` -
`NOT_APPLICABLE`

Examples: - Beneish M-Score cannot be calculated because required
financial inputs are missing. - Order-book analysis is unavailable
because permitted L2/L3 data was not obtained. - A graph relationship is
incomplete because the relevant filing could not be retrieved. - PDF OCR
produced uncertain text that needs manual confirmation.

Missing data is not evidence of misconduct and is not evidence of
safety.

------------------------------------------------------------------------

## 14. Security and AI-Safety Requirements for Detection

-   Treat filings, PDFs, web pages, and OCR text as untrusted input.
-   Ignore instructions embedded in retrieved documents.
-   Do not let documents or model outputs grant agents new permissions.
-   Validate every structured LLM response.
-   Do not execute model-generated SQL, Cypher, shell commands, or URLs
    without controlled validation.
-   Restrict agents to the tools and data required for their roles.
-   Avoid sending credentials or unrelated personal data to model
    providers.
-   Preserve the original source evidence.
-   Keep audit logs of important analysis runs and model versions.

See `SECURITY.md` for the broader application security policy.

------------------------------------------------------------------------

## 15. MVP Implementation Priority

The proposal's architecture and acceptance needs support the following
suggested order.

### Phase 1 --- Core forensic prototype

1.  Company/ticker identification.
2.  Ingest at least one supported annual report or public filing.
3.  Extract auditor notes and relevant document passages.
4.  Store source and page references.
5.  Calculate Beneish M-Score for a test case with sufficient inputs.
6.  Create a sample director/company relationship in Neo4j with
    provenance.
7.  Aggregate available specialist results through LangGraph.
8.  Generate a report showing findings and missing data.

### Phase 2 --- Expanded numerical and graph analysis

1.  Cash-flow-to-EBITDA divergence methodology and tests.
2.  Multi-period revenue and earnings anomaly exploration.
3.  Related-party relationship and transaction-path investigation.
4.  Promoter pledge data ingestion and a documented review methodology.
5.  Analyst review and finding lifecycle.

### Phase 3 --- Market microstructure

1.  Confirm permitted access to NSE L2/L3 data.
2.  Build and validate the event-data pipeline.
3.  Engineer and document order-book features.
4.  Evaluate Isolation Forest anomaly ranking.
5.  Train XGBoost only if defensible labels are available.
6.  Evaluate event windows around corporate announcements.

This order is a development recommendation, not a claim that all
features are already implemented.

------------------------------------------------------------------------

## 16. Acceptance Criteria

A methodology implementation is ready for demonstration when:

-   [ ] The company and financial period are unambiguous.
-   [ ] Every calculation retains its inputs and formula version.
-   [ ] Beneish M-Score is reproducible for a test case with sufficient
    valid inputs.
-   [ ] Missing or invalid financial values produce an explicit
    non-calculable state.
-   [ ] Cash-flow-to-EBITDA divergence has a documented formula before
    thresholds are used.
-   [ ] Document findings link to the original filing and page where
    available.
-   [ ] OCR-derived passages are identified.
-   [ ] Graph relationships retain DIN/company identifiers and source
    provenance.
-   [ ] Inferred graph paths are distinguished from disclosed
    relationships.
-   [ ] Market anomaly outputs include data windows, features, and model
    version.
-   [ ] XGBoost evaluation uses a documented labelled dataset if
    supervised classification is claimed.
-   [ ] The Meta CIO preserves specialist outputs and identifies
    conflicts.
-   [ ] The report shows missing data and analysis limitations.
-   [ ] No output describes a potential anomaly as confirmed fraud.

------------------------------------------------------------------------

## 17. Open Methodology Decisions

The following remain decisions for the development team because they are
not defined by the proposal:

1.  Exact financial-statement field mapping for each data provider.
2.  Final Beneish M-Score accounting definitions and interpretation
    threshold.
3.  Exact cash-flow-to-EBITDA divergence formula and alert threshold.
4.  Revenue/earnings anomaly features and comparison windows.
5.  Promoter pledge fields, denominator, comparison window, and
    thresholds.
6.  Spoofing event definition and minimum order-book data granularity.
7.  XGBoost label source and label-quality review process.
8.  Isolation Forest training period and anomaly threshold.
9.  Corporate graph entity-resolution rules and transaction-edge
    evidence requirements.
10. Red Flag Score scale, component weights, and calibration.
11. Analyst review roles and review outcomes.
12. Data refresh frequency and historical coverage.

Record decisions in the relevant architecture, schema, and changelog
documents. Do not silently turn an unvalidated assumption into a
production rule.

------------------------------------------------------------------------

## 18. Disclaimer

Abhimanyu provides automated forensic research indicators and
investigative leads. Its outputs are not proof of fraud, legal
conclusions, personalized investment advice, or guaranteed predictions
of market behavior.

Every material finding should be independently reviewed against original
disclosures and other authoritative evidence. The system must
communicate uncertainty, data gaps, model limitations, and conflicting
evidence clearly.

------------------------------------------------------------------------

## 19. Source Alignment

This document is based on the supplied seven-page
**Project_Proposal.pdf**:

*BharatForensic AI --- Institutional-Grade Multi-Agent Forensic Tool for
the Indian Stock Market.*

Proposal-derived elements include: - Four target investigation areas:
RPT circular loops, promoter pledge anomalies/group-entity obfuscation,
sentiment vs. reality, and order-book spoofing. - DocSynthesizer,
Microstructure Fraud, Forensic Accounting, Network Graph, and Meta CIO
agent roles. - LlamaIndex, Gemini Flash, XGBoost, Isolation Forest,
Beneish M-Score, Python, Neo4j, and LangGraph. - BSE/NSE announcements,
financial fundamentals, MCA-21 director networks, annual reports, and
vector/graph storage. - LangGraph orchestration and the proposed
forensic risk report.

Additional formula detail, candidate features, data contracts,
evaluation practices, safeguards, and implementation phases are
explicitly presented as implementation references or
recommendations---not as details stated in the original proposal.
