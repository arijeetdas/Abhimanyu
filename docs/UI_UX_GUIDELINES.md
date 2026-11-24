# UI/UX Guidelines --- Abhimanyu

**Product:** Abhimanyu\
**Proposal title:** BharatForensic AI --- Institutional-Grade
Multi-Agent Forensic Tool for the Indian Stock Market\
**Platforms:** Next.js web dashboard and Flutter mobile application\
**Status:** UI/UX specification for implementation

> **Source alignment:** The supplied project proposal defines a dual
> frontend: a detailed Next.js analyst portal with interactive corporate
> graphs and PDF split-screen evidence inspection, plus a Flutter mobile
> app for quick ticker lookups, high-priority flags, offline report
> caching, and push alerts. This document preserves those priorities.
> Visual styling, component behavior, accessibility, and layout details
> below are design recommendations to make those requirements
> implementable.

------------------------------------------------------------------------

## 1. Product Experience Vision

Abhimanyu should feel like a professional corporate-forensics research
workstation---not a trading terminal, stock-tip app, or gamified
investing product.

The interface helps users answer:

1.  **What company am I investigating?**
2.  **What potential warning signs were found?**
3.  **Why was each warning raised?**
4.  **What evidence supports it?**
5.  **What is missing, uncertain, or needs human verification?**
6.  **How are the company, promoters, directors, and related entities
    connected?**

### Experience principles

-   **Evidence first:** A finding must lead to its supporting document,
    metric, disclosure, or graph relationship.
-   **Explain risk, not sensationalize it:** Avoid alarmist labels or
    implying fraud is confirmed.
-   **Progressive disclosure:** Show the executive summary first, with
    deeper evidence and methodology available on demand.
-   **Clarity over density:** Professional analyst screens can be
    information-rich, but grouping, hierarchy, and spacing must make
    them scannable.
-   **Honest uncertainty:** Make unavailable data, stale data, model
    limitations, and confidence/quality indicators visible.
-   **Desktop depth, mobile speed:** The web experience is for deep
    research; mobile prioritizes monitoring and quick review.
-   **Consistent terminology:** Use the same agent, indicator, company,
    filing, and report terms across both platforms.

------------------------------------------------------------------------

## 2. Visual Direction

### 2.1 Recommended theme

Use a dark, institutional research aesthetic with restrained color
accents. The theme should evoke a forensic workstation while maintaining
strong contrast and readable document text.

**Suggested base palette (design recommendation):**

  Token              Suggested color   Usage
  ------------------ ----------------- --------------------------------
  `background`       `#0B1015`         Main application background
  `surface-1`        `#121A22`         Primary cards and panels
  `surface-2`        `#18232D`         Elevated panels, menus
  `surface-3`        `#202D38`         Hover/selected backgrounds
  `border`           `#2B3945`         Dividers and outlines
  `text-primary`     `#E8EEF3`         Main text
  `text-secondary`   `#A6B4C0`         Supporting text
  `text-muted`       `#788895`         Metadata, disabled text
  `accent`           `#42D6A4`         Primary actions, active states
  `accent-hover`     `#2DBB8A`         Hover state
  `info`             `#62B5F7`         Informational states
  `warning`          `#F4C56A`         Caution/needs review
  `high-risk`        `#F08A72`         High-priority risk indicator
  `critical`         `#E35D6A`         Critical severity
  `success`          `#55C98A`         Completed/validated states

These are proposed tokens, not colors specified in the project proposal.
Test contrast before finalizing.

### 2.2 Color semantics

Color must not be the only way to convey a state. Pair every severity
color with text, an icon, or a label.

  -----------------------------------------------------------------------
  State                               Recommended treatment
  ----------------------------------- -----------------------------------
  Informational                       Blue accent + "Info" label

  Needs review                        Amber accent + "Review" label

  High priority                       Orange/red accent + "High" label

  Critical                            Red accent + "Critical" label

  Verified/source-backed              Neutral or green verification
                                      treatment

  No issue detected in analyzed data  Neutral label; never imply the
                                      company is fraud-free

  Missing data                        Gray, explicit "Unavailable" / "Not
                                      analyzed" label

  Processing                          Animated progress + readable status

  Failed                              Error icon + explanation + retry if
                                      supported
  -----------------------------------------------------------------------

Avoid large red backgrounds, flashing alerts, aggressive countdowns, or
stock-market-style panic visuals.

### 2.3 Typography

Recommended font stack:

-   **Interface:** Inter, Geist, or system sans-serif.
-   **Numbers and financial metrics:** Tabular numerals
    (`font-variant-numeric: tabular-nums`).
-   **Document viewer:** A comfortable document font with selectable
    text and appropriate zoom.

Hierarchy:

  Level             Use
  ----------------- -------------------------------------------------
  Page title        Company/report name or page purpose
  Section heading   Main analysis groups
  Card title        Individual finding/module
  Body              Explanations and descriptions
  Metadata          Filing date, source, period, model version
  Dense tables      Slightly smaller text, but maintain readability

Do not use ultra-small text for risk explanations, disclaimers, source
references, or financial figures.

------------------------------------------------------------------------

## 3. Navigation and Information Architecture

### 3.1 Web dashboard navigation

Recommended primary navigation:

-   **Overview** --- overall monitoring and recent activity.
-   **Investigate** --- search and launch company investigations.
-   **Reports** --- saved and completed reports.
-   **Watchlist** --- companies the user wants to monitor (recommended
    feature; confirm scope).
-   **Alerts** --- investigation or filing alerts.
-   **Settings** --- account, notification preferences, and app
    configuration.

The proposal explicitly defines company/ticker lookup, reports, alerts,
and deep-dive research. Watchlist and settings are suggested navigation
elements, subject to implementation scope.

### 3.2 Desktop shell

Recommended layout:

-   Persistent left sidebar for primary navigation.
-   Top bar for global company search, notifications, and account menu.
-   Main content area with consistent page padding.
-   Optional contextual right panel on investigation pages for evidence,
    metadata, or selected graph entity.
-   Sidebar can collapse to icons, but icon-only navigation must provide
    tooltips and accessible labels.

### 3.3 Mobile navigation

Use a bottom navigation bar for the most frequent tasks:

-   Home
-   Search
-   Reports
-   Alerts

Settings and secondary actions should be accessible from the
account/profile area. Avoid reproducing the desktop navigation density
on mobile.

------------------------------------------------------------------------

## 4. Core Screens

## 4.1 Overview / Home

**Purpose:** Give users a quick understanding of recent investigations,
high-priority findings, and current activity.

Recommended sections:

1.  **Search company** --- prominent search field with company name,
    ticker, or supported identifier.
2.  **Recent investigations** --- latest reports and their status.
3.  **Priority findings** --- selected high-priority flags with concise
    explanation and source link.
4.  **Processing activity** --- queued, processing, completed, and
    failed jobs.
5.  **Data freshness** --- last update/retrieval time where applicable.
6.  **Coverage notice** --- brief reminder that analysis depends on
    available data.

Avoid presenting a global "market is unsafe" status without a defined
methodology and verified data.

### Empty state

When a new user has no investigations:

-   Explain what company investigation does.
-   Show a company search input.
-   Provide a simple example action.
-   Do not show fake reports or fabricated risk metrics.

## 4.2 Company Search

Requirements:

-   Search by company name or ticker.
-   Support autocomplete only from verified company records.
-   Show company name, exchange/ticker, and relevant identifier to
    disambiguate similar names.
-   Clearly show "No matching company" and "Search unavailable" states.
-   Do not imply a company is supported if data coverage is not
    available.

Search result rows/cards should include:

-   Company name.
-   Ticker/exchange.
-   Available data coverage or latest filing date, if known.
-   "Investigate" action.

## 4.3 Start Investigation

Before starting a costly investigation, show a concise
confirmation/context panel:

-   Selected company.
-   Available investigation modules.
-   Data coverage and known limitations.
-   Expected workflow stages (not a guaranteed duration unless
    measured).
-   Whether the investigation may use external AI providers, according
    to the applicable privacy disclosure.

Primary action: **Start Investigation**.

Do not require users to understand technical agent names to launch a
report.

## 4.4 Investigation Progress

Show the investigation as a step-based status timeline. Use the actual
backend job state; do not fake progress percentages.

Suggested stages, when implemented:

1.  Collecting company filings and data.
2.  Processing annual reports.
3.  Extracting auditor and disclosure information.
4.  Running accounting analysis.
5.  Analyzing corporate relationships.
6.  Running market anomaly analysis (if data is available).
7.  Synthesizing findings.
8.  Preparing report.

Each stage should have states: waiting, active, completed, failed,
skipped, or unavailable.

For a failed stage: - State what failed in plain language. - Indicate
whether the overall report is partial. - Provide retry if the backend
supports it. - Do not label the overall investigation "Completed" if
required outputs failed without disclosure.

## 4.5 Company Forensic Report

This is the primary web product screen.

### Recommended report hierarchy

**Header** - Company name and ticker/exchange. - Report creation/update
timestamp. - Data coverage period. - Investigation status. - Actions:
refresh/re-run if supported, save, export if implemented.

**Executive summary** - Short neutral summary of the most relevant
indicators. - Aggregate risk score only if a defined and validated score
exists. - Explain score methodology and data coverage adjacent to the
score. - Show "Insufficient data" rather than a score when inputs are
incomplete.

**Findings overview** - Severity/priority grouping. - Finding count by
category, if meaningful. - Category labels: Accounting,
Governance/Relationships, Disclosure, Market Activity, Sentiment
vs. Reality.

**Detailed findings** Each finding should show: - Finding title. -
Severity/priority label. - Short explanation. - Why it was flagged. -
Evidence/source reference. - Relevant period/date. - Analysis type
(calculated metric, ML anomaly, extracted disclosure, or AI
interpretation). - Limitations or confidence/quality information, if
available. - Action: **View Evidence**.

**Analysis modules** - Forensic Accounting. - Corporate Relationship
Network. - Document/Auditor Findings. - Market Microstructure (only when
data coverage supports it). - Sentiment vs. Reality (when implemented).

**Data coverage and limitations** - Sources analyzed. - Sources
unavailable or failed. - Reporting periods covered. - Data freshness. -
OCR/extraction limitations. - Modules not run and reasons.

**Disclaimer** Place a concise, persistent statement that risk
indicators are investigative leads and are not proof of fraud or
investment advice.

### Risk-score UX

The proposal mentions a "Red Flag Score" / forensic risk score but does
not define a formula, scale, weighting, or calibration method.

Until the score is validated: - Prefer a **Findings Summary** over an
unexplained numerical score. - If a prototype score is displayed, label
it clearly as experimental. - Show the components and data coverage. -
Avoid gauge meters that suggest scientific precision. - Do not use
"Safe," "Fraudulent," or "Buy/Sell" verdicts.

## 4.6 Forensic Accounting Module

Present calculations in an inspectable layout.

For Beneish M-Score: - Value and interpretation label, if the chosen
methodology supports one. - Financial period. - Required input values. -
Calculation components. - Formula/methodology disclosure. - Data source
and extraction provenance. - Missing inputs and calculation status.

For cash-flow-to-EBITDA divergence: - Display relevant values and
periods side-by-side. - Use a simple chart only when it improves
interpretation. - Explain why the divergence triggered review. - Avoid
implying that a divergence alone proves manipulation.

## 4.7 Corporate Relationship Graph

The proposal specifically calls for an interactive graph using
Cytoscape.js or Vis.js.

### Layout

-   Graph canvas as the main focus.
-   Search/filter panel for company, director, DIN, relationship type,
    or entity.
-   Selected node details in a side panel.
-   Legend for node and edge types.
-   Zoom, pan, fit-to-view, reset, and expand/collapse controls where
    supported.

### Visual encoding

Use consistent node shapes or icons for entity types:

-   Company.
-   Director/person.
-   Promoter/group entity, if represented by verified data.
-   Other supported entity types.

Use edge labels and/or line styles for relationship types, such as
directorship or disclosed relationship. Do not encode relationships that
are merely inferred as verified facts.

### Interactions

-   Select node to show details.
-   Select edge to show relationship evidence and source.
-   Search and highlight matching nodes.
-   Expand network only on explicit user action.
-   Filter by source, date, relationship type, and
    confidence/verification status where those fields exist.
-   Provide a table/list alternative for accessibility and users who
    cannot interpret graph layouts.

### Graph provenance

The selected node/edge panel should include: - Entity name and
identifier. - Relationship type. - Source filing/document. - Observation
or filing date. - Whether the connection is source-confirmed or
algorithmically inferred.

Avoid graph layouts that imply guilt through proximity, red coloring, or
dramatic animation.

## 4.8 PDF Split-Screen Evidence Inspector

The proposal specifies a PDF.js viewer with bounding-box coordinate
highlighting and navigation from an extracted finding to the relevant
annual-report passage.

### Layout

Desktop: - Left pane: PDF pages. - Right pane: finding/evidence
details. - Optional synchronized report navigation. - Resizable divider
between panes.

Tablet: - Side-by-side if space allows; otherwise switch between
"Document" and "Finding" tabs.

Mobile: - Use a full-screen document view with a clear **Evidence
Details** drawer or separate tab. - Avoid forcing two narrow columns.

### Evidence navigation

When a user selects **View Evidence**: - Open the correct document. -
Navigate to the relevant page when the page reference is available. -
Highlight the extracted passage or bounding box only if coordinate data
is reliable. - Display the extraction source (PDF text/OCR). - Show the
original text alongside the AI summary. - Allow the user to zoom and
select text.

If the page or bounding box is unavailable: - Open the document at the
closest known location. - Explain that precise highlighting is
unavailable. - Never fabricate a highlighted region.

### Document controls

-   Page navigation.
-   Zoom in/out and fit-to-width.
-   Search document text where supported.
-   Download/open original only where permitted.
-   Document metadata.
-   Clear indicator for OCR-derived content.

## 4.9 Alerts

Alert content should be factual and concise.

Each alert: - Company name/ticker. - Alert category. - Priority label. -
Brief reason. - Filing or event timestamp. - Link to the related
finding/report. - Source availability.

Notification preferences should allow users to control alert categories
and frequency if those controls are implemented.

Do not send duplicate alerts for the same event without an explicit
reason. Avoid notifications that reveal detailed private report contents
on lock screens.

## 4.10 Reports List

Recommended table/list columns:

-   Company.
-   Ticker/exchange.
-   Report status.
-   Report date.
-   Data coverage.
-   Findings count or summary (only when computed).
-   Last updated.
-   Action: Open report.

Provide: - Search. - Filters by company, status, date, and finding
priority. - Sorting. - Pagination or incremental loading. - Clear empty
state. - Failed/partial report states.

On mobile, use compact report cards rather than a wide table.

## 4.11 Mobile Quick Lookup and Report

Flutter mobile is designed for quick lookups and high-priority
monitoring.

Recommended report layout: 1. Company header. 2. Short findings summary.
3. High-priority flags. 4. Tap-to-expand explanations. 5. Evidence
source and date. 6. Data coverage and limitations. 7. Link/action to
open deeper analysis where available.

Do not attempt to reproduce the full graph workstation or split PDF
interface on small screens. Offer simplified graph summaries or a
relationship list if needed.

## 4.12 Offline Report Cache

The proposal identifies Hive as the mobile cache for previously
retrieved risk reports.

UX requirements: - Clearly identify cached/offline reports. - Show the
report's last successful update. - Indicate that offline content may be
stale. - Distinguish cached content from live data. - Provide a refresh
action when online. - Show an offline state without blocking access to
available cached reports. - Handle cache expiration and missing cached
documents clearly.

------------------------------------------------------------------------

## 5. Component Guidelines

### 5.1 Buttons

-   One primary action per major screen/section.
-   Secondary actions should be visually quieter.
-   Destructive actions require confirmation.
-   Disabled buttons should explain why where practical.
-   Use text labels for important actions; do not rely on icons alone.

### 5.2 Cards

Cards should group related information, not wrap every individual text
element.

Recommended card content: - Clear title. - Relevant status. - Short
summary. - Optional metadata. - One logical action.

Use subtle borders and backgrounds; avoid excessive shadows and stacked
rounded containers.

### 5.3 Tables

Financial and filing tables should: - Align numeric values
consistently. - Use tabular numerals. - Clearly label currency, units,
and periods. - Keep column headers visible for long tables. - Support
horizontal scrolling on smaller widths. - Provide accessible row and
column headers. - Highlight missing values with an explicit label
instead of zero.

### 5.4 Charts

-   Use charts only to clarify a comparison, trend, or anomaly.
-   Label axes, units, and time period.
-   Include a textual summary or accessible data table.
-   Avoid truncated or misleading axes.
-   Use a consistent color mapping.
-   Do not imply causation from a correlation.
-   Show data gaps.

### 5.5 Badges and statuses

Use restrained status badges: - Completed. - Processing. - Partial. -
Failed. - Unavailable. - Needs review.

Do not color every metric or label. Severity must be consistent
throughout the product.

### 5.6 Tooltips and methodology

Use tooltips for short definitions, not for critical information users
must discover.

Provide a dedicated methodology section or expandable panel for: -
Indicator definitions. - Formula descriptions. - Model/data source. -
Period covered. - Known limitations.

------------------------------------------------------------------------

## 6. Interaction and Feedback

### 6.1 Loading

Use skeletons for content loading and progress indicators for actual
jobs. Do not display invented percentages.

### 6.2 Success

Use inline confirmation for actions such as saving a report or changing
preferences. Avoid unnecessary modal popups.

### 6.3 Errors

Error messages should explain: - What happened. - What the user can do
next. - Whether data/report content is still available.

Do not show raw stack traces or provider error payloads.

### 6.4 Confirmation

Require confirmation before: - Deleting a saved report or account
data. - Starting a potentially expensive operation if the cost/usage is
material and known. - Performing irreversible administrative actions.

### 6.5 Long-running tasks

-   Allow users to navigate away while jobs continue.
-   Keep job status available in reports/activity.
-   Make retry behavior clear.
-   Avoid blocking the entire application.

------------------------------------------------------------------------

## 7. Responsive Design

### Web breakpoints (recommended)

  -----------------------------------------------------------------------
  Range                               Behavior
  ----------------------------------- -----------------------------------
  Small mobile                        Single-column layout; navigation
                                      and evidence use full-screen or
                                      drawers

  Large mobile                        Single-column content; compact
                                      tables/graphs

  Tablet                              Two-column layouts only when
                                      content remains readable

  Desktop                             Persistent sidebar, multi-panel
                                      report and evidence inspection

  Large desktop                       Expanded graph/PDF workspaces, but
                                      maintain a readable max-width for
                                      text
  -----------------------------------------------------------------------

Use fluid widths and content-driven breakpoints rather than rigid
device-specific layouts.

### Responsive rules

-   Company report cards stack vertically on narrow screens.
-   Graph controls collapse into a toolbar or drawer.
-   PDF/evidence panes become tabs or stacked sections.
-   Tables scroll horizontally rather than compressing values illegibly.
-   Search remains easy to reach.
-   Mobile actions should be thumb-accessible.
-   Do not hide critical risk explanations behind hover-only
    interactions.

------------------------------------------------------------------------

## 8. Accessibility

Aim for WCAG 2.2 AA where practical.

-   Ensure text and interactive controls have sufficient contrast.
-   Do not use color alone to represent severity or status.
-   Support keyboard navigation.
-   Provide visible focus indicators.
-   Use semantic headings and landmarks.
-   Label form controls and search fields.
-   Provide accessible names for icon buttons.
-   Make modal/drawer focus behavior correct.
-   Respect reduced-motion preferences.
-   Provide text alternatives for charts and graph visualizations.
-   Ensure screen-reader users can access relationship data through a
    structured list/table.
-   Avoid tiny touch targets; target approximately 44×44 CSS pixels for
    mobile controls where practical.
-   Ensure PDF evidence can be accessed through a text-based alternative
    where possible.

------------------------------------------------------------------------

## 9. Motion and Animation

Abhimanyu is a research product; animation should help users understand
state and navigation, not create spectacle.

Recommended: - Short transitions for panel open/close. - Subtle hover
and focus feedback. - Clear processing animation. - Smooth graph
navigation with reduced-motion support.

Avoid: - Flashing red alerts. - Constantly pulsing risk scores. -
Excessive parallax. - Decorative motion behind dense financial
content. - Animations that delay access to reports.

Honor the operating system's reduced-motion setting.

------------------------------------------------------------------------

## 10. Content and Writing Style

Use professional, neutral, precise language.

### Preferred terms

-   "Potential anomaly"
-   "Flagged for review"
-   "Indicator"
-   "Evidence"
-   "Source disclosure"
-   "Data unavailable"
-   "Analysis incomplete"
-   "Potential relationship"
-   "Requires independent verification"

### Avoid

-   "Fraud confirmed" unless a verified authoritative source explicitly
    establishes it and the product is accurately quoting that source.
-   "This company is safe."
-   "Guaranteed scam."
-   "Buy now" / "Sell now."
-   "The AI caught criminals."
-   Unsupported certainty or sensational claims.

### Example wording

**Instead of:** "FRAUD DETECTED! Company is manipulating accounts."

**Use:** "Potential accounting anomaly identified. The cash-flow and
earnings pattern differs from the analyzed historical periods. Review
the supporting financial statements and auditor notes."

**Instead of:** "No fraud found."

**Use:** "No indicators were raised from the data analyzed. This is not
a guarantee that the company has no undisclosed risks."

------------------------------------------------------------------------

## 11. Data Quality and Coverage UX

Every report should make the following easy to discover:

-   Data sources successfully analyzed.
-   Data sources unavailable.
-   Reporting periods covered.
-   Latest retrieval timestamp.
-   Modules completed, skipped, or failed.
-   Extraction/OCR limitations.
-   Missing inputs.
-   Whether the report is partial.

Do not let missing data appear as zero, blank "healthy" charts, or green
checkmarks.

Suggested coverage summary:

  -----------------------------------------------------------------------
  Module                  Status                  Coverage / note
  ----------------------- ----------------------- -----------------------
  Annual reports          Completed / Partial /   Periods and documents
                          Unavailable             analyzed

  Financial metrics       Completed / Partial /   Required values
                          Unavailable             available

  Director network        Completed / Partial /   Records and sources
                          Unavailable             covered

  Market microstructure   Completed / Not run /   Feed/data access note
                          Unavailable             

  Sentiment vs. reality   Completed / Not run /   Documents compared
                          Unavailable             
  -----------------------------------------------------------------------

Only populate statuses from actual job/data state.

------------------------------------------------------------------------

## 12. Design System and Frontend Implementation

### 12.1 Web

The proposal specifies Next.js 14 App Router and Tailwind CSS.

Recommended implementation: - Centralized design tokens using CSS
variables. - Reusable layout, card, badge, table, search, drawer, and
modal components. - Shared severity and status mappings. - Responsive
design utilities. - Consistent spacing, typography, and radius scale. -
Accessible components with keyboard support. - Keep domain logic and API
state out of purely presentational components.

### 12.2 Mobile

The proposal specifies Flutter and BLoC.

Recommended implementation: - Shared color, typography, spacing, and
component tokens. - Reusable status badges and finding cards. - BLoC
states for loading, success, partial success, failure, and offline
cache. - Clearly separated network, cached, and stale report states. -
Consistent behavior between Android and iOS.

### 12.3 Shared product language

Both clients should share: - Company and ticker formatting. - Finding
categories. - Severity labels. - Report states. - Data-coverage
language. - Disclaimers. - Date and financial-period formatting.

The mobile app can simplify layout, but should not change the meaning or
severity of findings.

------------------------------------------------------------------------

## 13. Suggested Screen Inventory

### Web

-   [ ] Overview
-   [ ] Company Search
-   [ ] Investigation Setup
-   [ ] Investigation Progress
-   [ ] Forensic Report
-   [ ] Forensic Accounting Details
-   [ ] Corporate Relationship Graph
-   [ ] PDF Evidence Inspector
-   [ ] Reports List
-   [ ] Alerts
-   [ ] Settings / Account
-   [ ] Empty, loading, partial, failed, and unavailable states

### Flutter

-   [ ] Home / Monitoring
-   [ ] Company Search
-   [ ] Company Quick Report
-   [ ] Findings Detail
-   [ ] Reports / History
-   [ ] Alerts
-   [ ] Offline / Cached Reports
-   [ ] Notification Preferences
-   [ ] Settings
-   [ ] Empty, loading, partial, failed, and offline states

Some screens are recommendations for implementation and are not
explicitly listed in the original proposal.

------------------------------------------------------------------------

## 14. MVP UI Priority

### Phase 1 --- Demonstrable core

1.  Company search.
2.  Investigation launch.
3.  Job progress/status.
4.  Report summary.
5.  Findings list with explanations and source references.
6.  Basic financial indicator details.
7.  Basic corporate relationship view.
8.  PDF viewing and evidence navigation where page references are
    available.
9.  Data coverage and limitations.

### Phase 2 --- Research experience improvements

1.  Advanced graph filters and expansion.
2.  Full PDF bounding-box highlighting.
3.  Reports search and filtering.
4.  Mobile quick report.
5.  Offline report caching.
6.  Push-alert preferences.

### Phase 3 --- Monitoring and refinement

1.  Watchlist experience if approved.
2.  More detailed alert controls.
3.  Expanded report comparison/history.
4.  Accessibility and performance refinements.
5.  Additional analysis modules when data access is reliable.

This is a suggested UI implementation order, not a fixed commitment from
the proposal.

------------------------------------------------------------------------

## 15. UX Acceptance Checklist

A UI release should be reviewed against the following:

### Clarity

-   [ ] The user can identify the company and report being viewed.
-   [ ] Every severity has a readable text label.
-   [ ] Findings explain why they were raised.
-   [ ] Source evidence is easy to open.
-   [ ] Missing data and partial analyses are obvious.
-   [ ] Risk scores are not shown without methodology context.

### Workflow

-   [ ] Search is discoverable.
-   [ ] Starting an investigation is clear.
-   [ ] Long-running jobs show truthful states.
-   [ ] Failed jobs provide actionable feedback.
-   [ ] Users can return to reports without losing context.

### Evidence

-   [ ] Finding-to-source navigation works when source metadata exists.
-   [ ] Original evidence is distinguishable from AI summary.
-   [ ] OCR-derived text is identified.
-   [ ] Graph relationships expose their source.
-   [ ] No unsupported highlight or relationship is fabricated.

### Responsive and accessible

-   [ ] Desktop split-view is usable.
-   [ ] Mobile report screens are readable.
-   [ ] Graph has a non-visual/list alternative.
-   [ ] Keyboard focus and navigation work.
-   [ ] Contrast and touch targets are checked.
-   [ ] Reduced motion is supported.

### Trust

-   [ ] No design implies a confirmed fraud verdict from an unvalidated
    model.
-   [ ] "No findings" is not presented as "safe."
-   [ ] Data coverage and limitations are visible.
-   [ ] Disclaimers are available at report level.

------------------------------------------------------------------------

## 16. Source Alignment and Open Decisions

### Explicitly defined by the project proposal

-   Flutter mobile app for quick lookups and high-priority alerts.
-   BLoC state management.
-   Hive caching of reports for offline access.
-   Firebase Cloud Messaging.
-   Next.js 14 App Router and Tailwind CSS web dashboard.
-   Interactive relationship graph with Cytoscape.js or Vis.js.
-   PDF.js split-screen inspector.
-   Bounding-box evidence highlighting and navigation from finding to
    document passage.
-   Mobile and web serving different depth of workflow: quick monitoring
    on mobile, deep investigation on web.

### Recommended design additions in this document

-   Dark institutional theme and color tokens.
-   Navigation structure and page inventory.
-   Responsive breakpoints and layout rules.
-   Accessibility requirements.
-   Severity-label design.
-   Empty/loading/error/partial states.
-   Watchlist and account/settings navigation.
-   Risk-score display cautions.
-   Detailed report hierarchy and content wording.

### Decisions to confirm

-   Final brand colors and typography.
-   Whether Watchlist is part of the MVP.
-   Final severity categories and their definitions.
-   Whether an aggregate forensic score is displayed in MVP.
-   Export/share functionality.
-   Graph node/edge categories and source-confirmation rules.
-   Mobile notification categories and privacy defaults.
-   PDF source-storage and download permissions.
-   Final responsive behavior for graph and PDF screens.

------------------------------------------------------------------------

## 17. Product Disclaimer

Abhimanyu provides forensic research support. Its flags are potential
indicators and investigative leads, not proof of fraud, legal
conclusions, or personalized investment advice.

The interface must communicate this distinction clearly and
consistently. Original disclosures and supporting evidence should remain
accessible so users can independently verify conclusions.
