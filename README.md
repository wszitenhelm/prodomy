# Prodomy

Smart Real Estate Listings Platform MVP scaffold.

## Installation and startup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start MySQL:

```bash
docker compose up -d mysql
```

3. Install dependencies:

```bash
pnpm install
```

4. Generate the Prisma client:

```bash
pnpm prisma:generate
```

5. Apply the initial migration:

```bash
pnpm prisma:migrate
```

6. Start the development server:

```bash
pnpm dev
```

7. Run the placeholder ingestion CLI:

```bash
pnpm ingest
```

## Marketplace note

The repository currently includes only the marketplace adapter boundary. Marketplace selection and extraction strategy will be documented once the ingestion implementation stage begins.
