# Frontend Design System (Baseline)

## Purpose

Create a stable visual baseline for future features with low coupling and high consistency.

## Source of Truth

- Tokens file: `src/app/core/design/design-tokens.css`
- Global style entrypoint: `src/styles.css`

## Architectural Fit

The design config is placed in `core/design` because:

- It is cross-feature infrastructure.
- It should not depend on domain/page modules.
- It can be consumed by any standalone component.

## Current Baseline (from Dashboard, Patients, Exams)

1. Page title
- Size: `32px`
- Weight: `800`
- Color: `#1e4854`

2. Page subtitle
- Size: `14px`
- Weight: `400`
- Color: `#6b7d87`

3. Search inputs
- Size: `13px`
- Placeholder: `#9aa8bf`

4. Section/table labels
- Size: `10px` to `12px`
- Weight: `800`
- Uppercase
- High letter spacing

5. Card content
- Title: `18px / 800`
- Body: `13px / 400`

## Rules for New Features

1. Reuse token values via `var(--...)`.
2. Keep typography scale within baseline unless product explicitly asks otherwise.
3. Use feature-local SCSS for layout only; keep global primitives in tokens.
4. If a new value repeats across features, promote it to a token.

## Suggested Adoption Pattern

1. Build feature UI using existing tokens first.
2. Add only missing tokens after review.
3. Update this document when introducing new reusable tokens.
