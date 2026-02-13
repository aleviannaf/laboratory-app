# SQLx Guide (SQLite)

This project uses `sqlx` with SQLite in the Tauri backend (`src-tauri`).

## Where SQLx Is Configured

- Dependency and features: `src-tauri/Cargo.toml`
  - `runtime-tokio-rustls`
  - `sqlite`
  - `macros`
  - `migrate`
- Connection and migrations:
  - `src-tauri/src/infra/db/sqlite.rs`

## Connection and Pool

The pool is created in `create_sqlite_pool`:

- Uses `SqliteConnectOptions::new().filename(...).create_if_missing(true)`
- Uses `SqlitePoolOptions` with:
  - `max_connections(5)`
  - `acquire_timeout(10s)`

Database path is resolved at runtime in `src-tauri/src/lib.rs` using:

- `app.path().app_data_dir()`
- file name: `laboratory.sqlite`

## Migrations

Migrations are embedded and executed on startup:

- `sqlx::migrate!("src/infra/db/migrations").run(pool).await`
- Called during app composition in `src-tauri/src/app/compose.rs`

Current schema for patients is defined in:

- `src-tauri/src/infra/db/migrations/0002_create_patients.sql`

Important:

- Do not edit a migration that was already applied in an existing database.
- If you change old migration files, SQLx checksum validation can fail with:
  - `migration X was previously applied but has been modified`

## Repository Pattern with SQLx

Concrete repository:

- `src-tauri/src/infra/repositories/patients_sqlite.rs`

Key points:

- Uses `sqlx::query(...)` with positional binds (`?1`, `?2`, ...)
- Uses explicit `.bind(...)` for each input field
- Maps rows manually with `row.get::<String, _>(...)`
- Converts SQLx errors to domain errors in `map_sqlx_error`
  - unique violation => `Conflict`
  - row not found => `NotFound`
  - fallback => `PersistenceError`

## Type Consistency Rules

This project keeps datetime fields as `TEXT` values in Rust-facing mapping.

In the migration, `birth_date`, `created_at`, `updated_at` include:

- `DATETIME NOT NULL`
- `CHECK(typeof(column) = 'text')`

Reason:

- SQLite is dynamically typed.
- Rust mapping here expects strings.
- The check protects integrity and avoids runtime decode mismatches.

## Testing SQLx Code

Repository integration tests are in:

- `src-tauri/tests/patients_sqlite_list_repository_tests.rs`

Test strategy:

- In-memory SQLite pool: `sqlite::memory:`
- Creates schema in test setup
- Validates insert/list behavior and filtering

## Useful Commands

From project root:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Run only SQLx repository tests:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --test patients_sqlite_list_repository_tests
```
