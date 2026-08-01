# AGENTS.md

## Mission

Build and maintain the Smart Real Estate Listings Platform described in `PROJECT_SPEC.md`.

Read `PROJECT_SPEC.md` before making architectural or product decisions.

The project is a time-limited MVP. Optimize for correctness, clarity, reproducibility and demonstrable user value. Do not overengineer.

---

## Required stack

Use:

* Next.js App Router,
* React,
* TypeScript strict mode,
* MySQL,
* Prisma,
* Zod,
* Crawlee,
* CheerioCrawler by default,
* PlaywrightCrawler only when necessary,
* Vitest,
* pnpm,
* Docker Compose.

Do not replace the stack unless an existing repository constraint makes it impossible. Explain any required deviation before making it.

---

## Architectural boundaries

Preserve this dependency direction:

```text
UI / Route Handlers
    ↓
Services
    ↓
Repositories
    ↓
Prisma
    ↓
MySQL
```

For ingestion:

```text
Crawler
    ↓
Source adapter
    ↓
Normalizer
    ↓
Quality gate
    ↓
Deduplicator
    ↓
Ingestion repository
```

Rules:

* Route Handlers must not access Prisma directly.
* Pages must not contain SQL or scraping logic.
* Repositories must not contain UI or HTTP behavior.
* Marketplace selectors must stay inside the selected marketplace adapter.
* Normalizers must not depend on Cheerio or page selectors.
* The crawler must not run inside a user-facing HTTP request.
* Server Components may call services directly.
* Do not fetch the application's own API from Server Components without a concrete reason.

---

## Coding standards

* Enable TypeScript strict mode.
* Avoid `any`.
* Use `unknown` at untrusted boundaries and narrow it.
* Use Zod for external input, query parameters, environment variables and important scraped-data boundaries.
* Use explicit return types for exported functions.
* Use descriptive names.
* Prefer small pure functions for normalizers and scoring rules.
* Keep functions focused.
* Avoid deep inheritance.
* Prefer composition.
* Avoid generic abstractions without a current use case.
* Do not add a dependency for trivial functionality.
* Use Decimal-compatible values for persisted money.
* Represent missing information as `null`, not zero, an empty fabricated string or `"unknown"` unless the domain enum explicitly includes `UNKNOWN`.
* Preserve raw values before normalization.
* Do not silently swallow errors.

---

## Database rules

* Use Prisma migrations.
* Never modify a committed migration after it has been conceptually applied; add a new migration.
* Add indexes for actual query patterns.
* Do not store every marketplace attribute as a dedicated column.
* Store core searchable fields as columns.
* Store reusable additional features in `ListingFeature`.
* Store uncommon source-specific values in JSON.
* Preserve source URL, source ID and raw extracted attributes.
* Do not delete probable duplicates.
* Group duplicates and select one primary result.
* Public search must return only published primary listings.

---

## Ingestion rules

* One marketplace only.
* No CAPTCHA bypass.
* No login bypass.
* No proxy rotation or anti-bot evasion.
* Use bounded concurrency.
* Use bounded retries.
* Save final failures.
* Do not abort an entire import because one listing fails.
* Keep the importer reproducible.
* Use fixed-seed deterministic candidate ordering inside each city and transaction group.
* Continue sampling until publication targets are reached or candidate limits are exhausted.
* Extract all useful attributes exposed by the page.
* Normalize stable fields.
* Preserve raw source values.
* Use CheerioCrawler when data is present in initial HTML or embedded data.
* Use Playwright only when browser execution is demonstrably necessary.
* Keep representative HTML fixtures for parser tests.

---

## Publication rules

Published listings require:

* apartment property type,
* sale or rent transaction type,
* PLN price,
* positive valid price,
* positive valid area,
* city,
* title,
* at least one usable photo.

Missing optional fields must not automatically reject a listing.

Suspicious records should normally become `NEEDS_REVIEW`.

Rejected and failed records must remain observable.

---

## Testing rules

For every task:

1. Add or update tests for changed behavior.
2. Run relevant focused tests during development.
3. Run the broad validation commands before declaring completion.

Required final commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not state that a command passed unless it was executed.

When a command cannot run because of an environment limitation:

1. state exactly which command failed,
2. include the relevant error,
3. distinguish an environment failure from a code failure,
4. complete all validation that is still possible.

---

## Task execution behavior

Before editing:

1. Read `PROJECT_SPEC.md`.
2. Inspect the current repository.
3. Identify existing conventions.
4. Write a short implementation plan.
5. Note important assumptions.

During implementation:

* Make cohesive changes.
* Do not rewrite unrelated code.
* Do not remove working functionality without a stated reason.
* Keep changes within the current task.
* Update documentation when commands or behavior change.
* Prefer the smallest complete solution.

After implementation:

1. Summarize changed files.
2. Explain major decisions.
3. List commands executed.
4. Report test and build results.
5. State remaining limitations honestly.
6. Do not claim the whole project is complete when only one stage was requested.

---

## UI rules

* Keep filters in URL search parameters.
* Initial listing results should be server-rendered.
* Use Client Components only for interaction.
* Include loading, error, empty and not-found states.
* Use semantic HTML.
* Ensure form controls have labels.
* Ensure keyboard usability.
* Keep the interface responsive.
* Do not spend excessive time on animation or branding.

---

## Security rules

* Validate all HTTP inputs.
* Validate environment variables.
* Never expose secrets.
* Never interpolate raw user input into SQL.
* Do not create a public crawler-triggering endpoint.
* Do not expose internal database errors to users.
* Do not trust LLM output.
* Validate any AI-generated structure with Zod.
* Do not log credentials or full environment objects.

---

## Scope-control rules

Do not add these unless a task explicitly changes the specification:

* authentication,
* accounts,
* favourites,
* saved searches,
* maps,
* coordinates,
* Elasticsearch,
* vector databases,
* microservices,
* queues,
* multiple marketplace integrations,
* multiple currencies,
* administration dashboard,
* payment features.

AI is a stretch feature. Do not implement it before the core acceptance criteria pass.