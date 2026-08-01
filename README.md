# Prodomy

Smart Real Estate Listings Platform MVP scaffold.

## Installation and startup

1. Copy the example environment file:

```bash
cp .env.example .env
```

The default `DATABASE_URL` uses `127.0.0.1` so Prisma connects over TCP consistently with local Homebrew MySQL.

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
pnpm db:generate
```

5. Apply the database migration:

```bash
pnpm prisma:migrate
```

6. Seed the local database with the deterministic sample dataset:

```bash
pnpm prisma:seed
```

7. Start the development server:

```bash
pnpm dev
```

8. Run the placeholder ingestion CLI:

```bash
pnpm ingest
```

## Marketplace note

The repository currently includes only the marketplace adapter boundary. Marketplace selection and extraction strategy will be documented once the ingestion implementation stage begins.
