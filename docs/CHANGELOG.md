# Changelog

All notable changes to **Abhimanyu - AI Based StockMarket Predictor and Investment Platform** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/) once the first release is tagged.

## How to use this file

- Add every user-visible or architecture-relevant change under **[Unreleased]** as you work.
- When releasing, rename **[Unreleased]** to the new version and date, then start a fresh **[Unreleased]** section.
- Group entries under these headings: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Schema changes must also reference the migration name and bump the schema version in `DATA_SCHEMA.md`.
- Changes to fraud rules or scoring must state the new `methodology_version` (see `FRAUD_DETECTION_METHODOLOGY.md`).
- Changes to agent prompts must state the new `prompt_version` (see `AI_SYSTEM_DESIGN.md`).

---

## [Unreleased]

### Added
- Ingestion pipeline for BSE/NSE announcements, annual reports, and shareholding patterns.
- Filing parser with OCR fallback for scanned documents.
- Promoter and director relationship graph builder.
- Rule-based fraud signals (receivable divergence, CFO vs PAT mismatch, pledge increase, auditor resignation).
- Investor alerts via in-app and email channels.

### Changed
- _Nothing yet._

### Fixed
- _Nothing yet._

### Security
- _Nothing yet._

---

## [0.1.0] - 2026-11-24 (Documentation baseline)

Initial planning and design documentation. No application code has been released yet.

### Added
- `README.md` with project overview: a team of AI financial detectives that reads company filings, uncovers hidden promoter relationships, and flags accounting fraud and pump-and-dump schemes in the Indian stock market.
- `docs/PRD.md` - product requirements.
- `docs/ARCHITECTTURE.md` - system architecture.
- `docs/AI_SYSTEM_DESIGN.md` - AI agent design.
- `docs/AGENT.md` - agent roles and responsibilities.
- `docs/API_SPECIFICATION.md` - API contract.
- `docs/DATA_SCHEMA.md` - relational, vector, and graph data model, covering:
  - Companies, persons, entities, auditors, and business groups
  - Filings, text chunks with embeddings, and extracted facts
  - Financial statements, line items, and derived ratios
  - Shareholding patterns, pledges, corporate actions, and related-party transactions
  - Market data, bulk/block deals, and social-promotion signals
  - Fraud signals, evidence, and company risk scores
  - Agent run audit trail, users, watchlists, portfolios, and alerts
- `docs/DATASET.md` - data sources and ingestion plan.
- `docs/FRAUD_DETECTION_METHODOLOGY.md` - detection rules and scoring.
- `docs/KNOWLEDGE_BASE.md` - domain knowledge for agents.
- `docs/FLOWCHART.md` - process flows.
- `docs/DEVELOPMENT_ROADMAP.md` - phased delivery plan.
- `docs/Tech_Stack.md` - technology choices.
- `docs/UI_UX_GUIDELINES.md` - interface guidelines.
- `docs/SECURITY.md` - security and data-protection policy.
- `docs/CHANGELOG.md` - this file.

[Unreleased]: #unreleased
[0.1.0]: #010---2026-11-24-documentation-baseline