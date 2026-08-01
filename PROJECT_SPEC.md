# Smart Real Estate Listings Platform

## 1. Project goal

Build a clean, working MVP of a Polish real-estate listings platform inspired by services such as Otodom.

The platform must:

1. Acquire real apartment offers from one publicly accessible marketplace.
2. Process approximately 160–250 candidate offers.
3. Publish exactly or approximately 100 high-quality offers:

   * target: 50 apartments for sale,
   * target: 50 apartments for rent,
   * distributed across 3–4 Polish cities.
4. Normalize inconsistent marketplace data.
5. Preserve raw extracted information for traceability.
6. Reject or quarantine unusable and suspicious offers.
7. Detect duplicates and present duplicate offers as one primary result.
8. Allow users to:

   * browse listings,
   * search by text,
   * filter listings,
   * paginate results,
   * open a listing details page.
9. Include a reproducible sample dataset so the application can work even when live scraping is unavailable.
10. Include a concise technical reasoning document.

The project is an MVP intended to be completed within approximately six hours. Prefer simple, reliable implementations over unnecessary abstractions.

---

## 2. Scope

### Included

* Apartments only.
* Transactions:

  * sale,
  * long-term rent.
* Currency:

  * PLN only.
* One marketplace integration.
* Three or four cities:

  * Kraków,
  * Warszawa,
  * Wrocław,
  * Gdańsk.
* Approximately 100 publishable offers.
* Text search.
* Structured filters.
* Pagination.
* Listing details.
* Data-quality processing.
* Duplicate grouping.
* Import reporting.
* Docker-based MySQL setup.
* Sanitized seed dataset.

### Excluded

Do not implement:

* authentication,
* user accounts,
* saved searches,
* favourites,
* payments,
* messaging,
* maps,
* latitude or longitude,
* commute-time calculations,
* multiple currencies,
* multiple marketplace integrations,
* microservices,
* message queues,
* Elasticsearch,
* vector databases,
* Kubernetes,
* a CMS,
* an administration dashboard,
* production-grade distributed crawling,
* anti-bot circumvention.

AI functionality is optional and must not block the basic product.

---

## 3. Technology stack

Use:

* Next.js with App Router,
* React,
* TypeScript with strict mode,
* MySQL,
* Prisma,
* Zod,
* Crawlee,
* CheerioCrawler as the default crawler,
* PlaywrightCrawler only when the chosen marketplace genuinely requires browser execution,
* Vitest for unit and integration tests,
* Docker Compose for MySQL,
* pnpm as package manager.

Use current stable package versions that are mutually compatible.

The repository should contain one Next.js application. The crawler must run as a separate CLI process inside the same repository, not as a long-running Route Handler.

---

## 4. Architecture

Use the following logical flow:

```text
Marketplace
    ↓
Crawling infrastructure
    ↓
Marketplace adapter
    ↓
Raw source listing
    ↓
Normalization
    ↓
Validation and quality gate
    ↓
Deduplication
    ↓
MySQL
    ↓
Repository layer
    ↓
Service layer
    ↓
Next.js pages and Route Handlers
```

### Layer responsibilities

#### Crawling infrastructure

Responsible for:

* request queue,
* URL deduplication,
* concurrency,
* timeouts,
* bounded retries,
* exponential backoff,
* request metadata,
* request status handling,
* failure handling,
* import progress.

It must not contain marketplace-specific selectors or real-estate normalization logic.

#### Marketplace adapter

Responsible for:

* creating search-result URLs,
* recognizing search and listing pages,
* extracting listing links,
* extracting source listing IDs,
* parsing listing-page markup,
* parsing JSON-LD,
* parsing embedded application state,
* extracting visible attributes,
* extracting photos,
* extracting contact information when publicly present,
* returning a source-shaped raw listing.

It must not write to the database.

#### Normalization

Responsible for:

* converting Polish prices to numbers,
* converting Polish decimal separators,
* normalizing square metres,
* normalizing room counts,
* normalizing floor notation,
* normalizing city names,
* normalizing transaction types,
* mapping marketplace labels into canonical fields,
* cleaning descriptions,
* generating validation warnings,
* preserving provenance.

It must not contain HTML selectors.

#### Quality gate

Responsible for deciding whether an ingested offer is:

* published,
* rejected,
* awaiting review,
* grouped as a duplicate.

#### Repository

Responsible only for database access.

#### Service

Responsible for application rules, query normalization, pagination and result composition.

#### Route Handler

Responsible only for:

* reading HTTP input,
* validating input,
* calling a service,
* returning an HTTP response.

Route Handlers must not contain direct Prisma queries or SQL.

#### Server Components

Server Components may call service functions directly. Do not make an unnecessary HTTP request from a Server Component to the application's own API.

The API must still be exposed for the assignment deliverable and potential external use.

---

## 5. Suggested repository structure

```text
.
├── AGENTS.md
├── PROJECT_SPEC.md
├── REASONING.md
├── README.md
├── docker-compose.yml
├── .env.example
├── data/
│   └── listings.sample.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── scripts/
│   └── ingest.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── listings/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── listings/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── not-found.tsx
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── listings/
│   ├── db/
│   │   └── prisma.ts
│   ├── modules/
│   │   ├── listings/
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   └── mappers.ts
│   │   └── ingestion/
│   │       ├── types.ts
│   │       ├── pipeline.ts
│   │       ├── normalize/
│   │       ├── validation/
│   │       ├── deduplication/
│   │       └── repositories/
│   ├── scraping/
│   │   ├── crawler.ts
│   │   ├── router.ts
│   │   ├── types.ts
│   │   └── selected-marketplace/
│   │       ├── adapter.ts
│   │       ├── discover.ts
│   │       ├── parse-listing.ts
│   │       ├── attribute-map.ts
│   │       └── fixtures/
│   └── shared/
│       ├── errors/
│       ├── logging/
│       └── utils/
└── tests/
```

The exact structure may be adjusted when there is a clear benefit, but preserve layer boundaries.

---

## 6. Marketplace selection

Use one marketplace only.

Before implementation:

1. Inspect a small number of public search-result and listing pages.
2. Confirm that apartment sale and rental offers are available.
3. Confirm that enough useful fields can be extracted.
4. Inspect:

   * initial HTML,
   * JSON-LD,
   * embedded JSON or application state,
   * network responses where appropriate.
5. Prefer a source that can be processed using CheerioCrawler.
6. Use PlaywrightCrawler only when essential data requires JavaScript execution.
7. Do not circumvent CAPTCHAs, login requirements or access controls.
8. Do not build anti-bot evasion.
9. Keep request volume limited and respectful.
10. Document the selected marketplace and the extraction approach in `README.md`.

Contact phone should be extracted only when it is publicly present in the normal page response or can be obtained through ordinary page interaction without bypassing access controls.

A missing contact phone must not prevent publication.

---

## 7. Candidate sampling

The goal is 100 publishable listings, not 100 attempted pages.

Target:

```text
50 sale listings
50 rental listings
distributed across 3–4 cities
```

Discover approximately 160–250 candidate listings because some will be:

* duplicates,
* expired,
* unavailable,
* missing mandatory fields,
* suspicious,
* non-apartment properties,
* parsing failures.

Create sampling groups by city and transaction type.

Example:

```text
Kraków / sale
Kraków / rent
Warszawa / sale
Warszawa / rent
Wrocław / sale
Wrocław / rent
Gdańsk / sale
Gdańsk / rent
```

Within every group:

1. Deduplicate discovered URLs.
2. Deterministically shuffle them using a fixed seed.
3. Process candidates in shuffled order.
4. Continue processing until the group's target is reached or its configured candidate limit is exhausted.

Use a deterministic shuffle or deterministic hash ordering.

Example seed:

```text
real-estate-mvp-v1:{city}:{transactionType}
```

The same source pages should produce the same candidate ordering.

Expose configuration for:

```text
target sale count
target rent count
cities
maximum candidate count
maximum result pages per group
seed
concurrency
```

---

## 8. Crawling configuration

Default configuration:

```text
HTTP crawler concurrency: 4
Browser crawler concurrency: 1–2
Maximum request attempts: 3
HTTP timeout: approximately 15 seconds
Browser navigation timeout: approximately 30 seconds
Candidate cap: approximately 250
```

Use bounded retries.

Retry temporary failures such as:

* timeout,
* connection reset,
* HTTP 429,
* HTTP 500,
* HTTP 502,
* HTTP 503,
* HTTP 504.

Do not repeatedly retry:

* HTTP 404,
* deterministic parsing failures,
* schema-validation failures,
* most HTTP 400 responses,
* persistent HTTP 403 responses.

Use exponential backoff with jitter where supported.

Use a descriptive user agent appropriate for a limited technical-assessment crawler.

Every final failed request must be recorded.

---

## 9. Source adapter contract

Use a small adapter even though only one marketplace is supported.

Suggested contract:

```ts
export interface MarketplaceAdapter {
  readonly source: Marketplace;

  buildSearchUrls(input: SourceSearchInput): string[];

  isSearchResultUrl(url: URL): boolean;

  isListingUrl(url: URL): boolean;

  extractListingLinks(
    page: ScrapedPage,
  ): DiscoveredListing[];

  parseListing(
    page: ScrapedPage,
  ): RawSourceListing;
}
```

Suggested types:

```ts
export type TransactionType = "SALE" | "RENT";

export interface SourceSearchInput {
  transactionTypes: TransactionType[];
  cities: string[];
  pageLimit: number;
}

export interface ScrapedPage {
  url: string;
  statusCode: number;
  html: string;
  fetchedAt: Date;
}

export interface DiscoveredListing {
  source: Marketplace;
  sourceUrl: string;
  sourceListingId: string | null;
  transactionTypeHint: TransactionType | null;
  cityHint: string | null;
}

export interface RawSourceListing {
  source: Marketplace;
  sourceUrl: string;
  sourceListingId: string | null;

  title: string | null;
  description: string | null;

  transactionTypeHint: TransactionType | null;
  locationText: string | null;

  priceText: string | null;
  attributes: Record<
    string,
    string | string[] | null
  >;

  photos: string[];

  contactName: string | null;
  contactPhone: string | null;

  structuredData: unknown;
  extractionWarnings: ExtractionWarning[];
}
```

Extraction priority:

```text
1. Embedded application data
2. JSON-LD
3. Explicit semantic HTML attributes
4. Stable visible DOM selectors
5. Description parsing
6. Optional AI extraction
```

Do not use an LLM for basic numerical fields when deterministic extraction is possible.

---

## 10. Data capture strategy

Use three representations.

### 10.1 Raw extracted data

Preserve:

* source URL,
* source listing ID,
* fetch time,
* raw extracted title,
* raw description text,
* all useful marketplace attributes,
* structured data,
* extracted photo URLs,
* contact data when publicly available,
* extraction warnings,
* content hash.

The raw attribute dictionary must contain all useful fields exposed by the source, not only price, area and room count.

Example:

```json
{
  "Powierzchnia": "52,7 m²",
  "Liczba pokoi": "3",
  "Piętro": "4/7",
  "Czynsz": "850 zł",
  "Kaucja": "5 000 zł",
  "Forma własności": "pełna własność",
  "Rynek": "wtórny",
  "Stan wykończenia": "do zamieszkania",
  "Typ zabudowy": "blok",
  "Rok budowy": "2016",
  "Ogrzewanie": "miejskie",
  "Okna": "plastikowe",
  "Winda": "tak",
  "Balkon": "tak",
  "Miejsce parkingowe": "garaż",
  "Dostępne od": "1 września 2026",
  "Typ ogłoszeniodawcy": "biuro nieruchomości",
  "Zwierzęta": "do uzgodnienia",
  "Wyposażenie": [
    "lodówka",
    "pralka",
    "zmywarka"
  ]
}
```

Do not create a database column for every marketplace attribute.

### 10.2 Canonical fields

Normalize fields that are broadly useful for search, sorting, comparison or presentation.

### 10.3 Additional normalized features

Use a normalized feature collection for reusable attributes such as:

* balcony,
* elevator,
* parking,
* garage,
* terrace,
* garden,
* furnished,
* pet-friendly,
* air conditioning,
* storage room,
* security,
* gated property.

Keep uncommon or uncertain source attributes in JSON.

---

## 11. Description representations

Keep separate fields:

### `descriptionRaw`

The original readable text extracted from the listing.

It may contain:

* repeated whitespace,
* excessive punctuation,
* inconsistent line breaks,
* duplicated paragraphs,
* marketplace boilerplate,
* spelling mistakes.

### `descriptionClean`

A deterministic cleaned representation used for display and text search.

Cleaning may:

* decode HTML entities,
* remove tags,
* remove scripts and styles,
* normalize Unicode,
* normalize non-breaking spaces,
* normalize repeated whitespace,
* normalize line breaks,
* remove duplicated paragraphs,
* reduce extreme punctuation,
* remove clearly repeated marketplace boilerplate.

Cleaning must not:

* invent information,
* change prices,
* change dimensions,
* rewrite the listing with an LLM,
* remove meaningful disclaimers,
* replace the raw version.

An optional AI summary must use a separate nullable field:

```text
descriptionSummary
```

---

## 12. Database model

Use Prisma migrations.

### Enums

At minimum:

```ts
enum TransactionType {
  SALE
  RENT
}

enum PublicationStatus {
  PUBLISHED
  REJECTED
  NEEDS_REVIEW
  DUPLICATE
}

enum IngestionStage {
  DISCOVERY
  FETCH
  PARSE
  NORMALIZE
  VALIDATE
  DEDUPLICATE
  PERSIST
}

enum IngestionResult {
  SUCCESS
  FAILED
  REJECTED
  DUPLICATE
}
```

### `Listing`

Suggested fields:

```text
id
source
sourceListingId
sourceUrl
sourceContentHash

transactionType
publicationStatus
rejectionReason

title
descriptionRaw
descriptionClean
descriptionSummary

priceAmount
currency
administrativeFee
depositAmount
utilitiesDescription

areaM2
rooms

city
district
street

floor
floorCount
buildingYear

marketType
ownershipType
buildingType
heatingType
condition
sellerType

availableFrom
sourcePublishedAt
sourceUpdatedAt
scrapedAt

contactName
contactPhone

rawAttributes
rawPayload

qualityScore
completenessScore
consistencyScore

duplicateGroupId
isPrimary

createdAt
updatedAt
```

Use appropriate nullable fields.

Currency must always be PLN for published listings.

Use `Decimal` for money and area values.

Do not use JavaScript floating-point arithmetic for persisted monetary values.

### `ListingPhoto`

Suggested fields:

```text
id
listingId
url
position
isPrimary
createdAt
```

Use a unique constraint preventing duplicate photo URLs for the same listing.

### `ListingFeature`

Use a practical structure such as:

```text
id
listingId
key
valueType
booleanValue
numberValue
textValue
rawValue
createdAt
```

Do not create a complex ontology.

Use normalized feature keys such as:

```text
BALCONY
ELEVATOR
PARKING
GARAGE
TERRACE
GARDEN
FURNISHED
PET_FRIENDLY
AIR_CONDITIONING
STORAGE_ROOM
SECURITY
GATED_PROPERTY
```

### `ImportRun`

Suggested fields:

```text
id
source
startedAt
finishedAt
status
configuration
candidatesDiscovered
pagesFetched
parsedCount
normalizedCount
publishedCount
rejectedCount
needsReviewCount
duplicateCount
failedCount
createdAt
```

### `IngestionIssue`

Suggested fields:

```text
id
importRunId
listingId
sourceUrl
stage
code
message
context
createdAt
```

### Indexes

Add indexes for common queries:

```text
publicationStatus
isPrimary
transactionType
city
priceAmount
areaM2
rooms
createdAt
source + sourceListingId
duplicateGroupId
```

Use a unique constraint on:

```text
source + sourceListingId
```

when the source ID exists reliably.

Also prevent duplicate canonical source URLs where practical.

---

## 13. Normalization

Implement deterministic, independently testable normalizers.

Required examples:

```text
"699 000 zł"       → 699000
"749 tys. zł"      → 749000
"2 900 zł/mies."   → 2900
"52,7 m²"          → 52.7
"52,7 m kw."       → 52.7
"3 pokoje"         → 3
"dwa pokoje"       → 2, when reliable
"parter"           → 0
"4/7"              → floor 4, floorCount 7
"4 piętro z 7"     → floor 4, floorCount 7
"Krakow"           → Kraków
```

Preserve original values in raw attributes or provenance metadata.

Prefer values using this hierarchy:

```text
explicit source field
> embedded structured data
> JSON-LD
> description extraction
> optional AI extraction
```

When values conflict:

1. Select the value from the more reliable source.
2. Preserve the conflicting values.
3. Record an ingestion warning.
4. Do not silently discard the conflict.

Missing values must be represented as `null`, not zero or empty fabricated values.

---

## 14. Publication quality gate

Distinguish ingestion from publication.

Every processable offer may be saved, but only qualified offers should appear in search results.

### Hard publication requirements

A published listing must have:

* a valid source URL,
* a source listing identity or stable URL,
* a recognizable apartment property type,
* a recognized transaction type,
* a non-empty title,
* a known city,
* a valid positive price in PLN,
* a valid positive area,
* at least one usable photo,
* no critical parsing conflict,
* no exact duplicate already selected as primary.

### Missing critical fields

Reject from publication when:

* price is missing,
* price is invalid,
* area is missing,
* area is invalid,
* city is missing,
* transaction type is unknown,
* no usable photos exist,
* the page is not an apartment listing.

Store the reason.

### Missing optional fields

The following must not automatically block publication:

* room count,
* floor,
* floor count,
* building year,
* district,
* street,
* contact phone,
* administrative fee,
* deposit,
* heating type,
* ownership type,
* seller type,
* balcony,
* elevator.

### Suspicious values

Suspicious values should normally produce `NEEDS_REVIEW`, not immediate deletion.

Examples:

* unusually low or high sale price,
* unusually low or high rental price,
* improbable area,
* improbable room count,
* inconsistent transaction type,
* price-per-square-metre value mistaken for total price,
* administrative fee mistaken for monthly rent,
* major conflict between structured area and description area.

Implement broad, configurable sanity ranges.

Do not optimize ranges for a single city.

Records marked `NEEDS_REVIEW` are excluded from public search unless they are explicitly approved.

---

## 15. Deduplication

Use staged deduplication.

### Exact duplicate detection

Match using:

* source plus source listing ID,
* canonicalized source URL,
* source content hash where useful.

### Probable duplicate candidate generation

Compare only listings in the same logical block:

* same transaction type,
* same city,
* compatible district or street,
* equal room count when known,
* area within approximately 3%,
* price within a reasonable tolerance.

Possible supporting evidence:

* normalized title similarity,
* description similarity,
* matching contact phone,
* overlapping photo URLs,
* matching floor,
* matching building year.

Do not compare every listing against every other listing using an LLM.

### Duplicate groups

Do not destructively delete probable duplicates.

Store:

```text
duplicateGroupId
isPrimary
```

One member is the primary listing shown in search results.

Other members remain stored as `DUPLICATE`.

Select the primary using:

1. active and valid status,
2. freshness,
3. completeness,
4. number of usable photos,
5. fewest consistency warnings.

When one duplicate contains a field that another duplicate lacks, the canonical display may use the additional value only when provenance is retained and no conflict exists.

Do not automatically merge conflicting values.

### Optional LLM adjudication

LLM duplicate adjudication is a stretch feature.

It may be used only for ambiguous candidate pairs after deterministic blocking and scoring.

The LLM must return structured JSON containing:

```text
decision
confidence
matchingEvidence
conflictingEvidence
```

Validate the response with Zod.

Do not automatically group a listing based only on a low-confidence LLM decision.

---

## 16. Search API

Implement:

```http
GET /api/listings
GET /api/listings/:id
```

### Listing query parameters

Support:

```text
q
transactionType
city
minPrice
maxPrice
minArea
maxArea
rooms
page
pageSize
sort
```

Optional useful filters:

```text
district
minRooms
maxRooms
```

Use one clear room-filter approach. Do not expose conflicting room parameters.

### Sorting

Support at least:

```text
newest
price_asc
price_desc
area_asc
area_desc
```

Optional:

```text
price_per_m2_asc
price_per_m2_desc
```

### Public result restriction

Search must return only:

```text
publicationStatus = PUBLISHED
isPrimary = true
```

### Pagination

Use page-based pagination.

Defaults:

```text
page = 1
pageSize = 20
maximum pageSize = 50
```

Response shape:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "appliedFilters": {}
}
```

### Text search

Search across:

* title,
* cleaned description,
* city,
* district,
* street,
* normalized feature labels where practical.

For only approximately 100 records, a clear MySQL text query is sufficient.

Do not introduce Elasticsearch or a vector database.

Keep search-building logic in a dedicated query builder or repository helper.

Never concatenate raw user input into SQL.

---

## 17. Route Handler rules

Route Handlers must:

1. Parse query parameters or route parameters.
2. Validate input with Zod.
3. Call a service.
4. Map known errors to HTTP responses.
5. Return JSON.

Route Handlers must not:

* access Prisma directly,
* contain complex filter construction,
* normalize scraped data,
* calculate duplicate scores,
* contain crawler logic.

Example architecture:

```text
Route Handler
    ↓
Listing service
    ↓
Listing repository
    ↓
Prisma
    ↓
MySQL
```

---

## 18. Frontend

### Listing page

Create a clean, responsive page containing:

* page title,
* sale/rent selector,
* text-search field,
* city selector,
* minimum and maximum price,
* minimum and maximum area,
* room filter,
* sort selector,
* active-filter summary,
* reset-filters action,
* results count,
* listing cards,
* pagination,
* empty state,
* loading state,
* error state.

Keep filters in the URL query string.

A copied URL must restore the same search state.

The initial listing result should be server-rendered.

Use Client Components only where interactivity is needed.

### Listing card

Display:

* primary photo,
* transaction badge,
* total sale price or monthly rent,
* administrative fee for rental offers when known,
* area,
* room count when known,
* city and district,
* floor when known,
* price per square metre for sale when available,
* short cleaned-description excerpt,
* source attribution or source label,
* link to details.

Use sensible placeholders for missing optional values.

Do not publish cards without photos because the quality gate excludes them.

### Listing detail page

Display:

* title,
* image gallery,
* sale price or monthly rent,
* administrative fee and deposit when available,
* area,
* room count,
* location,
* floor information,
* building information,
* market and ownership information,
* normalized features,
* full cleaned description,
* contact information when available,
* source publication date when known,
* scrape freshness,
* link to the original listing,
* notice that the data originated from an external marketplace.

Return a proper not-found state for missing, rejected or non-primary duplicate listings.

### Visual quality

The interface does not need advanced branding.

It must be:

* readable,
* consistent,
* responsive,
* keyboard accessible,
* usable on mobile and desktop,
* free of obvious layout problems.

Avoid spending excessive time on animation or design systems.

---

## 19. Import CLI

Implement:

```bash
pnpm ingest
```

Useful options:

```bash
pnpm ingest --target-sale=50 --target-rent=50
pnpm ingest --cities=krakow,warszawa,wroclaw,gdansk
pnpm ingest --max-candidates=250
pnpm ingest --seed=real-estate-mvp-v1
```

Exact syntax may use an argument-parsing library or environment configuration.

The importer must:

1. Create an import run.
2. Discover candidates by group.
3. Deduplicate URLs.
4. deterministically shuffle each group.
5. Fetch candidate pages.
6. Parse raw data.
7. Normalize values.
8. validate quality.
9. detect duplicates.
10. persist records and issues.
11. stop after targets are reached or limits are exhausted.
12. finalize import-run statistics.
13. print a clear summary.

Example summary:

```text
Import completed

Candidates discovered: 212
Pages fetched: 189
Parsed successfully: 171
Normalized successfully: 164
Published sale: 50
Published rent: 50
Rejected: 28
Needs review: 12
Duplicates: 14
Fetch failures: 9
Parsing failures: 7
```

The command must exit non-zero only for a fatal import failure, not because individual listings failed.

---

## 20. Seed dataset

The repository must contain a sanitized normalized sample dataset containing approximately 100 listings.

Implement:

```bash
pnpm db:seed
```

The seed must make the UI fully demonstrable without a live crawl.

The sample data must include:

* approximately 50 sale offers,
* approximately 50 rental offers,
* multiple cities,
* multiple price and area ranges,
* optional missing values,
* realistic feature variation,
* usable image URLs or clearly documented local placeholders,
* no secrets.

The README must distinguish:

* live imported data,
* reproducible sample data.

---

## 21. Error handling and observability

Implement structured application errors.

Examples:

```text
INVALID_QUERY
LISTING_NOT_FOUND
DATABASE_UNAVAILABLE
SCRAPE_TIMEOUT
PARSE_FAILED
NORMALIZATION_FAILED
QUALITY_REJECTED
DUPLICATE_DETECTED
```

Log important ingestion events using structured objects rather than unstructured console strings where practical.

Do not log secrets.

Do not allow one failed listing to abort the whole import.

Save ingestion issues with:

* URL,
* stage,
* code,
* message,
* useful context,
* import-run ID.

---

## 22. Testing

Prioritize boundary and business-rule tests.

Required unit tests:

1. price normalization,
2. area normalization,
3. room normalization,
4. floor normalization,
5. description cleaning,
6. publication quality gate,
7. suspicious-value classification,
8. deterministic sampling,
9. exact duplicate detection,
10. probable duplicate candidate generation.

Required parser tests:

* store representative HTML fixtures,
* parse a sale listing,
* parse a rental listing,
* parse a listing with missing optional fields,
* handle a changed or missing selector gracefully.

Required service or repository tests:

* filter by transaction type,
* filter by city,
* filter by price range,
* filter by area range,
* combine filters,
* paginate results,
* exclude rejected records,
* exclude non-primary duplicates,
* retrieve a valid detail,
* reject an unavailable detail.

At minimum, the following commands must pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not claim tests pass unless they were actually executed.

---

## 23. Development commands

Provide scripts for:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm ingest
```

Provide Docker Compose for MySQL.

Provide `.env.example`.

Expected local startup should be approximately:

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Document the actual commands accurately.

---

## 24. Optional AI feature

AI must be optional and must not delay the core MVP.

Preferred stretch feature:

```text
natural-language query
→ validated structured listing filters
→ ordinary deterministic database search
```

Example:

```text
“I want a cheap apartment around 40 m² in Kraków”
```

Possible result:

```json
{
  "transactionType": "RENT",
  "city": "Kraków",
  "minArea": 35,
  "maxArea": 45,
  "sort": "price_asc"
}
```

Requirements:

* return structured JSON,
* validate with Zod,
* never generate SQL,
* expose generated filters to the user,
* allow users to edit or remove filters,
* keep the application fully functional with AI disabled,
* document ambiguous interpretations,
* do not objectively classify subjective words such as “nice.”

Alternative optional AI use:

* extraction of difficult free-text attributes,
* ambiguous duplicate adjudication,
* short listing summaries.

Do not add more than one AI feature within the MVP.

---

## 25. Security and correctness

Requirements:

* validate every HTTP input,
* validate scraped data at trust boundaries,
* do not construct SQL from untrusted strings,
* do not expose database errors directly,
* do not expose environment secrets,
* do not implement an unauthenticated public endpoint that starts a crawler,
* do not scrape within a user-facing request,
* do not bypass access controls,
* do not make destructive duplicate decisions without retaining originals,
* do not treat missing values as zero,
* do not use AI output without schema validation.

---

## 26. `REASONING.md`

Create a concise one-page document covering:

1. What data was extracted and why.
2. How unstructured and low-quality data was handled.
3. Where AI was or was not used and why.
4. One key assumption.
5. One product success metric.
6. One important failure mode or limitation.
7. What would be improved with more time.

Use the following core reasoning:

* Capture all useful source attributes.
* Normalize only stable, searchable concepts.
* Preserve raw values for traceability.
* Distinguish ingestion from publication.
* Exclude offers without price, area, city, transaction type or photos.
* Preserve rejected offers and failure information.
* Keep AI outside the critical ingestion and search path.
* Use one source because correctness matters more than source count.
* Use Next.js because one deployable application reduces MVP integration overhead.
* Run the crawler as a CLI because scraping must not be tied to HTTP request duration.
* Use one primary listing per duplicate group.

Primary product success metric:

```text
Search-to-detail conversion:
percentage of search sessions in which the user opens at least one listing.
```

Key assumption:

```text
The MVP supports Polish apartments for sale and long-term rent in PLN from one marketplace.
```

Important limitation:

```text
The scraper depends on external page structure and may require maintenance when the marketplace changes its HTML or embedded data.
```

Future improvements:

* more marketplace adapters,
* freshness monitoring,
* scheduled refresh,
* map and geospatial search,
* stronger cross-source deduplication,
* natural-language search,
* saved searches,
* automated parser-regression monitoring.

---

## 27. Acceptance criteria

The project is complete when:

1. MySQL runs through Docker Compose.
2. Database migrations apply successfully.
3. The sample seed creates approximately 100 listings.
4. Approximately half are sale and half are rental listings.
5. Listings cover at least three cities.
6. The listing page loads.
7. Users can switch between sale and rent.
8. Users can search by text.
9. Users can filter by city, price and area.
10. Users can filter by rooms.
11. Users can sort results.
12. Search state is represented in the URL.
13. Results are paginated.
14. A listing details page works.
15. Rejected listings do not appear publicly.
16. Non-primary duplicates do not appear separately.
17. A CLI ingestion command exists.
18. Import failures are recorded.
19. A marketplace adapter exists.
20. Parser fixtures and tests exist.
21. `pnpm lint` passes.
22. `pnpm typecheck` passes.
23. `pnpm test` passes.
24. `pnpm build` passes.
25. `README.md` contains exact setup instructions.
26. `REASONING.md` contains the required one-page reasoning.
27. The application remains usable without an AI API key.

---

## 28. Engineering priorities

When tradeoffs are necessary, use this priority order:

1. Correct database and data model.
2. Reproducible seeded application.
3. Working browse, search and details flow.
4. Reliable normalization and publication rules.
5. Clear crawler separation.
6. Tests for risky boundaries.
7. Documentation.
8. Duplicate grouping.
9. Live crawling completeness.
10. Optional AI.
11. Visual polish.

Do not sacrifice the working core product to finish an optional feature.