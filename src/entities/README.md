Entities layer (FSD)

- Purpose: host business models / domain types and small domain helpers.
- Location: `src/entities/<model>/`
- Migration strategy used here: new `@entities/*` modules re-export current types from `src/shared/types` to remain fully backward-compatible.

Recommended usage:
- New feature logic should import domain types from `@entities/<model>`.
- Keep API DTOs in `src/shared/api/types.ts`.
