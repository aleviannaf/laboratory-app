# Architecture Overview

This project is a desktop app with:

- Frontend: Angular (`src/app`)
- Backend: Tauri + Rust (`src-tauri`)
- Database: SQLite via SQLx

## High-Level Layers

The backend follows a Clean Architecture style.

### 1. Domain (`src-tauri/src/domain`)

- Entities
- DTOs
- Error types
- Ports (traits/interfaces)

Example:

- `domain/patients/entity.rs`
- `domain/patients/dto.rs`
- `domain/patients/ports.rs`
- `domain/patients/errors.rs`

Rules:

- No framework/database details inside domain.

### 2. Application (`src-tauri/src/application`)

- Use cases orchestrating business flows.

Example:

- `application/patients/create_patient.rs`
- `application/patients/list_patients.rs`

Rules:

- Depends on domain ports.
- Does not depend on SQLx directly.

### 3. Infrastructure (`src-tauri/src/infra`)

- DB connection and migrations
- Repository implementations

Example:

- `infra/db/sqlite.rs`
- `infra/db/migrations/*`
- `infra/repositories/patients_sqlite.rs`

Rules:

- Adapts external tools (SQLite/SQLx) to domain ports.

### 4. Interface / IPC (`src-tauri/src/interface`)

- Tauri commands (entry points for frontend calls)

Example:

- `interface/ipc/patients.rs`

Rules:

- Maps input/output for IPC boundary.
- Delegates to use cases from `AppState`.

### 5. Composition (`src-tauri/src/app`)

- Wires dependencies and app state.

Example:

- `app/compose.rs`
- `app/state.rs`
- `lib.rs` (Tauri builder + command registration)

Flow at startup:

1. Resolve app data directory
2. Create SQLite pool
3. Run migrations
4. Build repositories
5. Build use cases
6. Register state and commands

## Frontend Structure (Angular)

Main organization:

- `src/app/layout` -> shell, sidebar, topbar
- `src/app/pages` -> feature pages (`dashboard`, `patient`, `exames`, ...)
- `src/app/core` -> app-level services (API bridge)
- `src/app/shared` -> reusable UI and utilities

Pattern used in pages:

- Container component orchestrates state and flows.
- Presentational components render isolated pieces (header, filters, table/cards, empty state).

Examples:

- Patients:
  - `pages/patient/patients.component.ts` (container)
  - `pages/patient/components/*` (presentational)
- Exams:
  - `pages/exames/exames.component.ts` (container)
  - `pages/exames/components/*` (presentational)

## Request Flow Example (Create Patient)

1. Angular UI collects form data.
2. Frontend service calls Tauri command via `invoke`.
3. IPC command (`interface/ipc/patients.rs`) receives input.
4. Command calls application use case.
5. Use case calls repository port.
6. SQLx repository persists in SQLite.
7. Result bubbles back to frontend.

## Data and Migration Strategy

- Migrations are source of truth for schema.
- New schema changes should be new migration files (append-only).
- Avoid editing previously applied migration files in active environments.

## Testing Strategy (Current)

- Backend tests under `src-tauri/tests`
- Focus on use-case and repository behavior
- SQLx repository tests use in-memory SQLite

## Conventions

- Keep commit messages in English.
- Keep responsibilities separated by layer/component.
- Prefer explicit mapping and error translation at boundaries.
