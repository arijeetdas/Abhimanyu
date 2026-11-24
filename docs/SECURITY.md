# Security Policy --- Abhimanyu

> **Project:** Abhimanyu\
> **Proposal title:** BharatForensic AI --- Institutional-Grade
> Multi-Agent Forensic Tool for the Indian Stock Market\
> **Document:** `docs/SECURITY.md`\
> **Status:** Security requirements and implementation guidance\
> **Scope:** Next.js web dashboard, Flutter mobile application, FastAPI
> backend, AI agents, data-ingestion pipelines, PostgreSQL, Neo4j,
> ChromaDB, Redis/Celery workers, and external data/model providers.

------------------------------------------------------------------------

## 1. Purpose

This document defines the security requirements, safeguards, operational
procedures, and development practices for Abhimanyu.

Abhimanyu processes corporate filings, annual reports, financial
information, director relationships, and market data. It uses AI and
machine-learning components to generate potential forensic risk
indicators. The platform must therefore protect:

-   User accounts and investigation history.
-   Company, filing, and financial records.
-   Original documents and extracted evidence.
-   Director and corporate relationship data.
-   AI prompts, agent state, model outputs, and generated reports.
-   Database credentials, API keys, service-account credentials, and
    deployment secrets.
-   Background jobs, queues, and internal service communications.

The supplied project proposal specifies FastAPI, LangGraph/LangChain,
Gemini and other possible model providers, PostgreSQL, Neo4j, ChromaDB,
Redis/Celery, Flutter, Next.js, and external Indian financial-data
sources. This policy applies security controls across that complete
architecture.

**Implementation status:** This document describes required and
recommended controls. It does not claim that these controls are already
implemented.

## 2. Security Objectives

Abhimanyu should follow these security objectives:

1.  **Confidentiality:** Prevent unauthorized access to user
    information, credentials, investigation records, and non-public
    operational data.
2.  **Integrity:** Prevent unauthorized modification of financial
    records, evidence, graph relationships, reports, and analysis
    results.
3.  **Availability:** Protect APIs, databases, workers, and user
    interfaces from avoidable disruption.
4.  **Evidence traceability:** Preserve the origin, timestamp, and
    processing history of material evidence.
5.  **Least privilege:** Give users, agents, workers, and services only
    the permissions required for their tasks.
6.  **AI safety:** Treat uploaded and retrieved documents as untrusted
    data, not as instructions to the AI system.
7.  **Auditability:** Record security-relevant activity without exposing
    secrets or unnecessarily sensitive information.
8.  **Responsible reporting:** Prevent an unverified AI-generated risk
    indicator from being represented as a confirmed finding of fraud.

## 3. System Components and Trust Boundaries

  -----------------------------------------------------------------------
  Component                           Security responsibility
  ----------------------------------- -----------------------------------
  Next.js web dashboard               Protect browser sessions, user
                                      actions, API communication, and
                                      displayed investigation data

  Flutter mobile app                  Protect locally cached reports,
                                      authentication tokens, and
                                      notification content

  FastAPI backend                     Authenticate and authorize
                                      requests, validate input, enforce
                                      business rules, and control service
                                      access

  LangGraph/LangChain agents          Restrict tools and data access;
                                      validate agent inputs and outputs

  LLM providers                       Receive only the information
                                      required for a model task and
                                      permitted by the data-handling
                                      policy

  PostgreSQL / Supabase               Protect structured company, filing,
                                      job, report, and user records

  Neo4j / Memgraph                    Restrict access to corporate
                                      relationship data and graph
                                      operations

  ChromaDB                            Protect document chunks,
                                      embeddings, and semantic retrieval
                                      access

  Redis / Celery                      Protect queued jobs, worker
                                      communication, and task payloads

  Data-ingestion services             Retrieve and process external data
                                      safely and in accordance with
                                      source terms

  Firebase Cloud Messaging            Deliver notifications without
                                      exposing confidential report
                                      contents

  Deployment platform                 Protect environment variables,
                                      service identities, logs, network
                                      access, and backups
  -----------------------------------------------------------------------

### 3.1 Trust boundaries

The system must treat the following as separate trust boundaries:

-   Public browser or mobile client to backend API.
-   Backend API to databases and background queues.
-   Background workers to external filing portals and data providers.
-   Agents to LLM providers and internal tools.
-   Uploaded or downloaded documents to document parsers and OCR.
-   Application services to hosting, monitoring, and notification
    providers.

Do not assume that data is trustworthy merely because it came from a
public filing portal or an internal service.

## 4. Authentication and Authorization

The project proposal does not specify a final authentication provider or
complete account model. The following are recommended requirements to
finalize before exposing the application to users.

### 4.1 Authentication

-   Require authentication for personal investigation history, saved
    reports, account settings, and other user-specific resources.
-   Use a maintained authentication solution rather than implementing
    password handling from scratch unless the team has a clear reason
    and sufficient security expertise.
-   If passwords are managed by the application, store only strong
    salted password hashes using a modern password-hashing algorithm
    such as Argon2id.
-   Never store plaintext passwords or reversible password encryption.
-   Require verified email addresses if email is used as an account
    identifier.
-   Implement secure password-reset and account-recovery flows.
-   Apply login rate limits and progressive abuse controls.
-   Avoid revealing whether an email address or account exists in
    authentication error messages.
-   Use multi-factor authentication for privileged or administrative
    accounts where supported.
-   Revoke active sessions or refresh tokens after password changes,
    account compromise, or administrative revocation.

### 4.2 Session and token security

For browser sessions:

-   Prefer secure, `HttpOnly`, and appropriately configured `SameSite`
    cookies for session credentials.
-   Enforce HTTPS.
-   Protect state-changing cookie-authenticated requests against
    cross-site request forgery (CSRF).
-   Rotate session identifiers after authentication and privilege
    changes.
-   Apply idle and absolute session-expiration policies.

For bearer-token authentication:

-   Keep access tokens short-lived.
-   Store refresh tokens securely and rotate them when used.
-   Validate token signature, issuer, audience, expiry, and permitted
    algorithm.
-   Never place tokens in URLs, query strings, analytics events, or
    application logs.
-   Do not store long-lived secrets in browser local storage if a safer
    session design is available.

For Flutter:

-   Store authentication tokens in platform-protected secure storage,
    not ordinary preferences or Hive.
-   Clear credentials on logout and account removal.
-   Do not include sensitive report content in notification previews by
    default.

### 4.3 Authorization and ownership

Use server-side authorization for every protected operation. Hiding a
button in the frontend is not access control.

Recommended roles:

  -----------------------------------------------------------------------
  Role                                Suggested permissions
  ----------------------------------- -----------------------------------
  Public visitor                      View public product information and
                                      permitted public pages

  Authenticated user                  Search supported companies and
                                      access their own saved
                                      investigations and reports

  Analyst                             Access explicitly assigned
                                      investigations and detailed
                                      evidence

  Administrator                       Manage users, service
                                      configuration, and operational
                                      controls

  Background worker                   Execute only its assigned job types
                                      and access only required resources
  -----------------------------------------------------------------------

The final role model must be confirmed by the team. The proposal does
not define these roles.

Requirements:

-   Check ownership or explicit sharing permissions before returning a
    user's investigation or report.
-   Deny access by default.
-   Enforce authorization in FastAPI service or route layers.
-   Prevent insecure direct object reference (IDOR) vulnerabilities by
    checking permissions for every requested object.
-   Keep administrative endpoints separate from ordinary user endpoints.
-   Record privileged actions in an audit log.

## 5. API Security --- FastAPI

All API endpoints must validate requests and enforce authorization.

### 5.1 Transport security

-   Use HTTPS for all production client-to-server and service-to-service
    communication.
-   Redirect HTTP to HTTPS where appropriate.
-   Use valid TLS certificates and supported TLS configurations.
-   Do not disable certificate validation in production clients.
-   Restrict CORS to the exact web application origins that require
    access.
-   Do not use wildcard origins with credentialed requests.

### 5.2 Input validation

-   Define request and response schemas using Pydantic.
-   Validate ticker symbols, company identifiers, date ranges,
    pagination values, and query parameters.
-   Enforce maximum request sizes.
-   Reject unexpected fields where strict validation is appropriate.
-   Normalize and validate identifiers before database queries.
-   Use parameterized database queries or safe ORM/query-builder
    methods.
-   Never concatenate untrusted input into SQL, Cypher, shell commands,
    or filesystem paths.
-   Validate uploaded file types using content inspection, not only
    filename extensions or client-supplied MIME types.

### 5.3 Rate limiting and abuse prevention

Apply rate limits to:

-   Login and password-reset endpoints.
-   Company search and investigation creation.
-   Expensive document-processing requests.
-   Report export and download endpoints.
-   Any endpoint that invokes an LLM or costly external provider.
-   Administrative operations.

Use Redis-backed rate limiting where appropriate so limits can be shared
across backend instances. Define limits based on user, IP address,
endpoint, and workload cost. Add request-size limits and concurrency
controls for expensive jobs.

### 5.4 API error handling

-   Return safe, consistent error responses.
-   Do not expose stack traces, internal hostnames, database errors, API
    keys, or provider credentials.
-   Assign request or correlation IDs to help trace failures.
-   Log detailed diagnostics only in protected server-side logs.
-   Avoid returning raw third-party provider responses when they may
    contain sensitive information.

### 5.5 HTTP security headers

Configure suitable headers at the web server or application boundary,
including:

-   Content-Security-Policy (CSP).
-   Strict-Transport-Security (HSTS) for HTTPS deployments.
-   X-Content-Type-Options: `nosniff`.
-   Referrer-Policy.
-   Frame restrictions through CSP `frame-ancestors` or an appropriate
    equivalent.
-   A restrictive Permissions-Policy where applicable.

CSP must be tested against the actual Next.js deployment and required
assets before enforcement.

## 6. Database Security

Abhimanyu uses separate stores for relational data, graph relationships,
semantic document retrieval, and background jobs. Each store must have
independent access controls.

### 6.1 PostgreSQL / Supabase

Store structured application and investigation data.

Requirements:

-   Use separate credentials for application runtime, migrations, and
    administration.
-   Give the runtime account only the permissions it needs.
-   Never expose database service-role keys or privileged credentials in
    frontend code.
-   Enable Row Level Security (RLS) on Supabase tables exposed through
    client-accessible APIs.
-   Write and test RLS policies for every user-owned table.
-   Do not assume RLS protects requests made through privileged server
    credentials; enforce authorization in the backend as well.
-   Use parameterized queries.
-   Require encrypted database connections in hosted environments.
-   Restrict database network access where the provider supports it.
-   Back up important data and test restoration.
-   Avoid storing unnecessary personal information.

### 6.2 Neo4j / Memgraph

Use the graph database for director, promoter, company, and
related-entity relationships.

Requirements:

-   Do not expose the graph database directly to public clients.
-   Allow graph access through authorized backend services.
-   Use a dedicated application account with limited privileges.
-   Keep administrative credentials separate from application
    credentials.
-   Parameterize Cypher queries; never build query strings from raw user
    input.
-   Validate allowed labels, relationship types, and query operations.
-   Record provenance for graph nodes and edges, including source and
    observation date where available.
-   Restrict destructive operations such as bulk deletion and schema
    changes.
-   Use encrypted connections when supported by the deployment.

### 6.3 ChromaDB

Use ChromaDB for semantic retrieval over annual-report passages and
other approved documents.

Requirements:

-   Keep the vector database on a private network or behind an
    authenticated backend service.
-   Do not expose unauthenticated collection or query endpoints
    publicly.
-   Separate collections or apply metadata filters where access
    boundaries require it.
-   Enforce company, document, and user authorization before returning
    retrieved chunks.
-   Validate metadata filters server-side.
-   Do not assume embeddings are anonymous; they may reveal information
    about the source text.
-   Apply retention and deletion rules to source chunks and their
    embeddings together.
-   Restrict administrative and collection-management operations.

### 6.4 Redis

Redis is used for Celery task queues and may support rate limiting or
caching.

Requirements:

-   Do not expose Redis to the public internet.
-   Require authentication and TLS where supported.
-   Use network restrictions and dedicated credentials.
-   Do not store passwords, API keys, or long-lived authentication
    tokens in ordinary cache entries.
-   Set appropriate expiration times for temporary data.
-   Separate production and development Redis instances or namespaces
    with clear access controls.
-   Restrict destructive commands and administrative access.
-   Treat queued task payloads as sensitive application data.

## 7. File Upload and Document Processing Security

Annual reports and regulatory documents are central inputs to Abhimanyu.
PDF files and extracted content must be treated as untrusted.

### 7.1 File validation

-   Accept only explicitly supported formats, initially PDF where
    required.
-   Enforce file-size and page-count limits.
-   Check actual file signatures and parseability.
-   Generate server-side filenames; do not trust user-supplied paths.
-   Reject malformed, encrypted, corrupted, or unsupported documents
    with safe error messages.
-   Store files outside executable application directories.
-   Prevent uploaded files from being served as executable content.
-   Use random identifiers rather than original filenames for storage
    paths.
-   Apply malware scanning where suitable scanning infrastructure is
    available.

### 7.2 Parser isolation

-   Run PDF parsing and OCR in restricted worker processes or
    containers.
-   Do not run parsers with administrator/root privileges.
-   Restrict worker filesystem access.
-   Apply CPU, memory, execution-time, and file-size limits.
-   Keep document-processing dependencies patched.
-   Prevent a document-processing worker from accessing unrelated
    internal services.
-   Clean up temporary files after processing according to the retention
    policy.

### 7.3 OCR and extracted text

-   Treat OCR output as untrusted input.
-   Validate extracted values before inserting them into structured
    financial records.
-   Preserve source-page references and extraction metadata.
-   Distinguish text directly extracted from a PDF from OCR-derived
    text.
-   Do not silently convert uncertain OCR results into verified
    financial facts.

## 8. AI, LLM, and Multi-Agent Security

Abhimanyu uses LangGraph/LangChain, a document intelligence pipeline,
and external LLM providers. AI-specific threats must be considered part
of the application's security model.

### 8.1 Prompt injection and untrusted documents

Annual reports, disclosures, web pages, scraped content, and
user-provided documents may contain malicious or instruction-like text.

Requirements:

-   Treat all retrieved document text as data, never as trusted system
    instructions.
-   Clearly separate system instructions, user requests, and retrieved
    evidence in prompts.
-   Tell agents not to follow instructions found inside documents or
    retrieved web content.
-   Do not allow a document to grant itself new tools, permissions, or
    access.
-   Do not execute code, shell commands, SQL, Cypher, or URLs merely
    because a document or model output requests it.
-   Validate all model-generated structured output against strict
    schemas.
-   Reject unexpected tool names, arguments, and action types.
-   Keep human approval for sensitive or destructive operations.

### 8.2 Agent permissions and tool security

Each agent must receive only the tools and data required for its
responsibility.

  -----------------------------------------------------------------------
  Agent / component       Permitted scope         Restrictions
                          (recommended)           
  ----------------------- ----------------------- -----------------------
  DocSynthesizer          Read approved documents No unrestricted
                          and produce structured  filesystem, shell, or
                          extraction              database administration

  ML Forensic Agent       Read validated          No arbitrary network or
                          financial/order-book    database write access
                          datasets and run        
                          approved models         

  Network Graph Agent     Read and perform        No unrestricted Cypher
                          approved graph queries; execution or
                          write only through      destructive graph
                          controlled graph        administration
                          services                

  Orchestrator / Meta CIO Read validated          No direct credential
                          specialist outputs and  access or unrestricted
                          prepare a report        execution tools

  Background worker       Execute assigned task   No access to unrelated
                          types                   user data or
                                                  administrative secrets
  -----------------------------------------------------------------------

The exact permissions must be implemented through backend service
boundaries, not merely described in prompts.

### 8.3 Model output validation

-   Require structured outputs for machine-consumed agent results.
-   Validate fields, types, ranges, and identifiers.
-   Treat model-generated URLs, SQL, Cypher, and code as untrusted.
-   Never use an LLM response as the sole authorization decision.
-   Never let an LLM decide whether a user may access a report.
-   Separate calculated metrics from generated narrative.
-   Preserve the underlying data and calculation method for numerical
    indicators.
-   Handle conflicting agent outputs explicitly.
-   Mark missing evidence and low-confidence extraction.

### 8.4 Data sent to model providers

Before sending data to Gemini, Groq, Claude, DeepSeek, or another
provider:

-   Send only the minimum content required for the task.
-   Do not send passwords, tokens, database credentials, or unrelated
    user information.
-   Review provider retention, training, regional-processing, and
    privacy terms.
-   Do not assume that a free API tier provides the same data-handling
    guarantees as a paid or enterprise agreement.
-   Document which provider receives which categories of data.
-   Provide an alternative or local processing path where required by
    the project's data policy.

The proposal lists multiple model providers as options. The final
provider and data-handling configuration must be selected before
production use.

### 8.5 Evidence-backed reporting

-   Every material finding should reference the source document, metric,
    data interval, or relationship record that supports it.
-   The report should identify whether a statement is a source fact,
    calculated metric, anomaly-model output, or LLM interpretation.
-   The platform must not present an AI-generated allegation as
    established wrongdoing.
-   A risk score must not be treated as a legal conclusion or guaranteed
    prediction.

## 9. External Data Sources and Scraper Security

The proposal identifies BSE, NSE, MCA-21, SEBI disclosures, Screener.in,
yfinance, and potential institutional providers such as CMIE Prowess and
Refinitiv.

Requirements:

-   Check each provider's terms, licensing, and permitted automated
    access before integration.
-   Use documented or officially supported APIs and feeds where
    available.
-   Respect rate limits and service restrictions.
-   Do not bypass authentication, access controls, CAPTCHAs, or
    technical restrictions.
-   Do not rotate identities or user agents to evade a provider's
    limits.
-   Store provider credentials in a secrets manager or protected
    environment configuration.
-   Validate downloaded content and response types.
-   Apply request timeouts and bounded retries.
-   Use allowlisted source hosts for automated retrieval.
-   Prevent server-side request forgery (SSRF) by blocking arbitrary
    user-supplied URLs and private/internal IP ranges.
-   Record source URL or source identifier, retrieval time, and relevant
    response metadata.
-   Identify stale or failed data retrieval in the investigation report.

For sources that require a session or browser automation, use only
access methods permitted by the source operator.

## 10. Background Jobs and Worker Security

Celery workers may process large PDFs, OCR tasks, embeddings, ML
analysis, and multi-agent investigations.

Requirements:

-   Accept job requests only through authenticated and authorized
    backend services.
-   Validate task arguments before enqueueing.
-   Use explicit task names and allowlisted task types.
-   Do not expose arbitrary task execution to users.
-   Keep worker credentials separate from API and database administrator
    credentials.
-   Give each worker only the database and service permissions required
    for its tasks.
-   Apply task timeouts, memory limits, and concurrency limits.
-   Use bounded retries and prevent retry storms.
-   Make tasks idempotent where practical.
-   Avoid placing secrets or unnecessary personal data in task payloads.
-   Record job ownership and verify it before returning job status or
    results.
-   Ensure one user's job cannot expose another user's documents or
    reports.
-   Monitor queue depth, failed jobs, and unusual task volume.

## 11. Frontend and Mobile Security

### 11.1 Next.js web dashboard

-   Keep private API keys and server credentials on the server.
-   Never prefix a secret with a public environment-variable name that
    exposes it to the browser.
-   Render untrusted filing text safely; avoid unsafe HTML injection.
-   Sanitize any content that must be rendered as HTML.
-   Apply CSP and other suitable browser security headers.
-   Protect cookie-authenticated state-changing actions against CSRF.
-   Validate redirects and prevent open-redirect vulnerabilities.
-   Avoid placing sensitive data in URLs.
-   Do not log access tokens or confidential report contents in browser
    telemetry.
-   Enforce report access on the backend for every request.

### 11.2 Flutter mobile application

-   Store tokens in platform-protected secure storage.
-   Do not store credentials in Hive.
-   Treat Hive as a cache, not an authoritative source of access
    permissions.
-   Clear user-specific cached information on logout or account removal.
-   Consider encryption for locally cached sensitive reports.
-   Avoid exposing confidential report contents on lock-screen
    notifications.
-   Validate deep links and notification payloads before navigation.
-   Do not disable TLS certificate validation.
-   Avoid embedding provider secrets in the mobile application; mobile
    binaries can be inspected.

### 11.3 PDF and graph interfaces

-   Render document content as untrusted data.
-   Do not execute embedded PDF scripts or active content.
-   Validate graph data before rendering.
-   Avoid unsafe HTML labels in graph nodes and tooltips.
-   Do not expose hidden database identifiers or internal service
    details unnecessarily.

## 12. Secrets and Environment Configuration

All secrets must remain outside the source repository.

Examples include:

-   `GEMINI_API_KEY`
-   `GROQ_API_KEY`
-   `ANTHROPIC_API_KEY`
-   `DATABASE_URL`
-   `NEO4J_PASSWORD`
-   `REDIS_URL`
-   Firebase service-account credentials
-   Any data-provider credentials

Requirements:

-   Maintain `.env.example` with placeholder values only.
-   Add `.env`, private keys, service-account files, and credential
    exports to `.gitignore`.
-   Never commit actual API keys or passwords.
-   Use deployment-platform secret storage for hosted environments.
-   Restrict access to production secrets.
-   Use separate credentials for development, testing, and production.
-   Rotate credentials periodically and immediately after suspected
    exposure.
-   Revoke unused or compromised credentials.
-   Avoid printing environment variables in debugging output.
-   Do not put secrets in Docker images, frontend bundles, screenshots,
    issue reports, or documentation.

If a secret is committed accidentally, removing it from the latest
commit is not enough. Revoke or rotate it first, then clean the
repository history where appropriate.

## 13. Encryption and Data Protection

### 13.1 Data in transit

-   Use HTTPS/TLS for public application traffic.
-   Use encrypted database and service connections where supported.
-   Do not send credentials over plaintext HTTP.
-   Validate certificates in production.

### 13.2 Data at rest

-   Use provider-supported encryption at rest for hosted databases and
    storage.
-   Encrypt sensitive backups.
-   Restrict access to stored documents and report files.
-   Consider application-level encryption for particularly sensitive
    fields if the threat model requires it.
-   Protect mobile cached reports when they contain user-specific or
    confidential information.

### 13.3 Data minimization and retention

-   Collect only information needed for the product's stated purposes.
-   Define retention periods for uploaded documents, extracted text,
    embeddings, reports, logs, and cached records.
-   Delete or expire associated vector chunks when their source
    documents are deleted, where required.
-   Avoid retaining raw third-party data beyond permitted terms.
-   Define account deletion and investigation deletion behavior.
-   Document which external providers receive data and what retention
    controls are available.

The project proposal does not specify a final retention schedule or
privacy policy. These must be agreed before production deployment.

## 14. Logging, Monitoring, and Audit Trails

### 14.1 Application logging

Record security-relevant events such as:

-   Authentication successes and failures.
-   Session creation, revocation, and privileged changes.
-   Authorization denials.
-   Investigation creation and completion.
-   Document ingestion failures.
-   Agent and worker failures.
-   Database and provider connectivity errors.
-   Rate-limit events.
-   Administrative actions.
-   Secret or configuration errors, without recording secret values.

### 14.2 Sensitive information in logs

Never log:

-   Passwords.
-   API keys or access tokens.
-   Database connection strings.
-   Full payment or identity credentials if such data is ever
    introduced.
-   Unnecessary personal information.
-   Full confidential document contents by default.

Use correlation IDs to connect API requests, jobs, worker activity, and
agent executions.

### 14.3 Evidence audit trail

For important forensic evidence, retain appropriate metadata:

-   Source identifier or URL.
-   Company/ticker identifier.
-   Filing date and retrieval timestamp.
-   Document identifier and page reference.
-   Extraction method (PDF text or OCR).
-   Processing/model version where practical.
-   Relevant calculation or model version.
-   Link between the finding and the evidence used.

Do not silently overwrite historical findings. Preserve version or
supersession information when analyses are rerun.

## 15. Dependency and Software Supply-Chain Security

-   Use maintained versions of Python, Node.js, Flutter, and their
    dependencies.
-   Pin or lock dependency versions for reproducible builds.
-   Review dependency updates before merging.
-   Run dependency vulnerability checks regularly.
-   Remove unused packages and services.
-   Protect CI/CD secrets and deployment credentials.
-   Restrict who can modify production deployment workflows.
-   Avoid installing packages from untrusted sources.
-   Scan container images where containers are used.
-   Keep OCR, PDF parsing, browser automation, and database packages
    updated.
-   Review licenses and security advisories for important dependencies.

Suggested development checks include Python dependency auditing, Node
package auditing, secret scanning, static analysis, and container
scanning where applicable.

## 16. Secure Development and Code Review

Every team member must follow these practices:

-   Use feature branches and reviewed pull requests.
-   Do not commit credentials, private datasets, or production exports.
-   Validate inputs at API boundaries.
-   Use parameterized SQL and Cypher.
-   Avoid unsafe shell execution.
-   Keep authentication and authorization checks server-side.
-   Add tests for access-control boundaries.
-   Review changes involving prompts, tools, external URLs, file
    parsing, and database queries carefully.
-   Separate development and production environments.
-   Use synthetic or approved sample data for testing where possible.
-   Record security-relevant architecture changes.

### Minimum security test cases

-   A user cannot access another user's private report by changing an
    ID.
-   An unauthenticated user cannot invoke protected investigation
    endpoints.
-   A user cannot invoke administrative APIs.
-   Oversized and malformed PDFs are rejected safely.
-   Prompt-injection text in a document cannot grant an agent new
    permissions.
-   Model output cannot execute arbitrary SQL, Cypher, shell commands,
    or URLs.
-   A worker cannot retrieve a job belonging to an unauthorized user.
-   Rate limits apply to expensive investigation endpoints.
-   Secrets do not appear in frontend bundles or logs.
-   Public clients cannot connect directly to private databases or
    Redis.

## 17. Backup and Recovery

-   Define backup frequency based on the importance and update rate of
    each data store.
-   Back up PostgreSQL records and required metadata.
-   Back up graph data and important vector/source metadata where
    needed.
-   Protect backups with access controls and encryption.
-   Store backups separately from the primary runtime environment where
    practical.
-   Define recovery objectives before production use.
-   Test restoration periodically.
-   Document recovery steps and responsible team members.
-   Do not assume a provider's backup feature is enabled unless
    verified.

A backup is not considered reliable until a restore test has succeeded.

## 18. Incident Response

The team should use the following process for suspected security
incidents.

### Step 1 --- Identify

Examples: - Exposed API key or database password. - Unauthorized report
or account access. - Suspicious API traffic. - Unexpected database
changes. - Compromised worker or deployment credentials. - Malicious
document exploiting a parser or agent workflow.

### Step 2 --- Contain

-   Revoke or rotate exposed credentials.
-   Disable compromised tokens or sessions.
-   Restrict affected endpoints or workers.
-   Isolate affected services where necessary.
-   Preserve relevant logs and evidence.

### Step 3 --- Investigate

-   Determine affected accounts, services, records, and time period.
-   Review access logs, job records, and deployment changes.
-   Identify the likely entry point and impact.
-   Check whether data was accessed, modified, or exposed.

### Step 4 --- Recover

-   Patch the underlying issue.
-   Restore verified data if necessary.
-   Rotate affected secrets.
-   Re-enable services only after appropriate checks.
-   Monitor for repeated suspicious activity.

### Step 5 --- Document

-   Record incident timeline, impact, response, and corrective actions.
-   Identify process or architecture improvements.
-   Notify affected parties where required by applicable obligations and
    policy.

Do not publish private credentials, personal information, or exploit
details in public issue trackers.

## 19. Vulnerability Reporting

If you discover a security vulnerability in Abhimanyu:

1.  Do not exploit it to access, modify, or delete data belonging to
    other people.
2.  Do not publish credentials, private records, or a working exploit
    publicly.
3.  Report the issue privately to the project maintainers through the
    repository's designated security contact.
4.  Include a clear description, affected component, impact, and safe
    reproduction steps.
5.  Allow maintainers reasonable time to investigate and prepare a fix
    before public disclosure.

**Security contact:** To be configured by the project maintainers before
public release. Do not invent or publish an unmonitored email address.

## 20. Deployment Security Checklist

Before a public deployment, verify the following:

### Application and API

-   [ ] HTTPS is enforced.
-   [ ] Authentication and authorization are implemented and tested.
-   [ ] CORS is restricted to required origins.
-   [ ] Request validation and size limits are enabled.
-   [ ] Rate limiting protects expensive and sensitive endpoints.
-   [ ] Safe error responses are used.
-   [ ] Security headers are configured.
-   [ ] Debug mode is disabled.

### Databases and queues

-   [ ] PostgreSQL is not publicly exposed unnecessarily.
-   [ ] Supabase RLS policies are enabled and tested for
    client-accessible tables.
-   [ ] Neo4j/Memgraph is accessible only to authorized services.
-   [ ] ChromaDB is not exposed without access controls.
-   [ ] Redis is private and authenticated.
-   [ ] Application credentials have least privilege.
-   [ ] Backups and restoration procedures are verified.

### AI and document processing

-   [ ] Retrieved documents are treated as untrusted data.
-   [ ] Agent tools are allowlisted and permission-scoped.
-   [ ] Model outputs are schema-validated.
-   [ ] No agent can access arbitrary shell or database administration
    tools.
-   [ ] File size, page count, parser time, and worker resources are
    limited.
-   [ ] Provider data-handling terms have been reviewed.
-   [ ] Findings retain evidence references.

### Secrets and operations

-   [ ] No secrets are committed to Git.
-   [ ] Production secrets are stored in deployment secret management.
-   [ ] Logs do not contain tokens or credentials.
-   [ ] Dependency and secret scans have been run.
-   [ ] Monitoring and incident contacts are configured.
-   [ ] Restore testing has been completed.

## 21. Security Ownership

The proposal assigns four broad development responsibilities. Security
is a shared responsibility and must be reviewed across all workstreams.

  -----------------------------------------------------------------------
  Workstream                          Security responsibilities
  ----------------------------------- -----------------------------------
  Frontend Lead                       Secure session handling, safe
                                      rendering, protected local cache,
                                      notification privacy, API
                                      authorization integration

  Data Pipelines & Scrapers           Source compliance, safe retrieval,
                                      SSRF prevention, file validation,
                                      data provenance, parser isolation

  Agentic AI & LangGraph              Prompt-injection defenses, tool
                                      allowlists, output validation,
                                      provider data minimization, agent
                                      permissions

  ML Models & Graph Database          Database access control, safe graph
                                      queries, data integrity, model
                                      input validation, evidence
                                      provenance
  -----------------------------------------------------------------------

A designated project maintainer should coordinate security reviews,
credential rotation, incident handling, and release readiness. The
proposal does not assign a separate security officer.

## 22. Policy Maintenance

Review this document:

-   Before the first public deployment.
-   Whenever authentication, storage, model providers, or data sources
    change.
-   After a security incident.
-   When significant vulnerabilities affect core dependencies.
-   At regular project milestones.

Record material changes in `CHANGELOG.md`.

------------------------------------------------------------------------

## 23. Important Disclaimer

Abhimanyu is a financial investigation and research-support platform.
Security controls protect the platform and its evidence; they do not
establish the correctness of every financial conclusion.

Potential anomalies must be independently reviewed. The platform must
not present an automated indicator as proof of fraud, a legal finding,
or a guaranteed investment outcome.

## 24. Source and Scope Notes

This policy is based on the supplied **Project_Proposal.pdf**, titled
*BharatForensic AI --- Institutional-Grade Multi-Agent Forensic Tool for
the Indian Stock Market*, and expands its architecture into actionable
security requirements.

The proposal explicitly identifies the application stack and data flows,
including FastAPI, LangGraph/LangChain, LLM providers, PostgreSQL,
Neo4j, ChromaDB, Redis/Celery, Next.js, Flutter, Firebase Cloud
Messaging, and external Indian financial-data sources.

Authentication, authorization roles, encryption details, retention
periods, incident ownership, and several operational safeguards are not
fully specified in the proposal. They are presented here as recommended
requirements to be finalized and implemented by the team.
