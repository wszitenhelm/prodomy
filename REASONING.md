# Technical Reasoning

## What we extract and why

The MVP extracts the fields required for public apartment search and safe publishing: title, transaction type, PLN price, administrative rent fee when present, deposit when present, area, rooms, location, floor/building details, photos, seller/contact fields, source dates, and normalized features. These fields support the product goals from `PROJECT_SPEC.md`: browse, text search, structured filtering, detail view, duplicate grouping, and source traceability.

## Unstructured and low-quality data handling

Marketplace pages are inconsistent, so the ingestion flow preserves raw payloads and raw source attributes, then normalizes stable fields separately. Description cleaning is deterministic and rule-based, not AI-based. Quality gates reject records with missing required publication fields, send suspicious records to `NEEDS_REVIEW`, and keep rejected/duplicate outcomes observable in the database without exposing them publicly.

## AI decision

AI is kept narrow and optional. The core MVP remains deterministic for crawling, normalization, quality control, deduplication, public search, and details pages; the only model-assisted step is an ingestion-time listing summary for already-published records. That summary is validated with Zod, stored separately from core numeric fields, and omitted entirely when the model is unavailable or returns an invalid structure.

## One key assumption

The implementation assumes one publicly accessible marketplace can provide enough apartment sale and rent listings across Kraków, Warszawa, Wrocław, and Gdańsk using ordinary HTTP responses plus embedded application data, without CAPTCHA bypass or authenticated access.

## One product success metric

The primary MVP success metric is whether a user can find a relevant apartment quickly from the published dataset: for example, completing a structured Kraków search with filters and reaching a usable detail page in a single session.

## One important failure mode

The biggest operational failure mode is marketplace drift: if Morizon changes result-page markup, embedded Nuxt payload structure, or listing-page field placement, the adapter may start under-extracting fields or misclassifying records even while the application itself still runs.

## Future improvements

If the core MVP proves useful, the next improvements should be: stronger search relevance, adapter resilience monitoring, richer duplicate explanations, source-change alerts, a saved local ingestion-summary artifact, and an optional AI-assisted intent-to-filters layer that still validates its output with Zod before use.
