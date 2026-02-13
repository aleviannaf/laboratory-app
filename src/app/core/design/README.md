# Design Config Location

This project keeps global design tokens in:

- `src/app/core/design/design-tokens.css`

Why this location:

- `core` is application-level and feature-agnostic.
- Tokens are shared by all pages/components.
- It avoids coupling visual constants to a specific feature folder.

Usage rule:

1. Define shared visual primitives (font sizes, colors, radius, spacing) only in tokens.
2. Feature SCSS should consume tokens via `var(--token-name)`.
3. If a token is reused by 2+ features, promote it to `design-tokens.css`.
4. Avoid hardcoded colors/font sizes in new features unless truly one-off.
