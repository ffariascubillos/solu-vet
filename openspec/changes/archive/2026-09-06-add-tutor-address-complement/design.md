## Context

`Tutor.region`, `Tutor.comuna`, and `Tutor.streetAddress` are all required fields, added in an earlier change that had to truncate the local `Tutor`/`Patient` tables because the prior free-text `address` values couldn't be split into the new columns. That risk doesn't apply here: `addressComplement` is new and optional, so existing `Tutor` rows simply get `NULL` — no data loss, no truncation.

The address string used for both on-screen display and the Google Maps link is built by two small pure functions in `apps/mobile/src/features/patients/tutor-address.ts`: `formatTutorAddress(tutor)` (used by both Tutor detail and Patient detail for the "Dirección: ..." line) and `buildTutorMapsUrl(tutor)` (used by the "Ver dirección en Maps" action). Both take the same `Tutor` object and independently build a comma-joined string from `streetAddress`, `comuna`, and `region`.

## Goals / Non-Goals

**Goals:**
- Let a Tutor record an optional apartment/floor/house detail, visible to whoever needs to physically find the unit.
- Guarantee the Maps link is unaffected — no risk of a stray "Depto 302" ending up inside a geocoding query.

**Non-Goals:**
- No format validation or length constraint on the value (confirmed with the user: plain optional text, not a specialized input).
- No change to `formatTutorAddress()`'s or `buildTutorMapsUrl()`'s existing output for Tutors that don't set the field.
- No backfill of existing Tutors.

## Decisions

- **Nullable Prisma column, not a required field with a default.** `addressComplement String?` on `Tutor`. Matches "optional" as stated by the user, and needs no migration-time backfill since `NULL` is a valid value for every existing row.
- **Kept out of `formatTutorAddress()` and `buildTutorMapsUrl()` entirely, rendered as its own display line instead.** Considered appending it into `formatTutorAddress()`'s single-line string (e.g. `"Av. Siempre Viva 123, Depto 302, Providencia, ..."`) — rejected: that string is also read by `buildTutorMapsUrl()`'s sibling logic conceptually (both build from the same three fields today), and touching the shared formatter is exactly the kind of change that could accidentally leak the complement into the Maps query later if someone refactors the two functions to share code. Keeping `tutor-address.ts` completely untouched removes that risk by construction, and matches the existing display pattern in Tutor detail / Patient detail, where "Correo:", "Teléfono:", and "RUT:" are already separate labeled lines rather than folded into one string.
- **Line omitted entirely when absent, not shown as "No registrado".** Unlike `Correo: {tutor.email || 'No registrado'}` (email is a core contact field, worth flagging as missing), the complement is a minor optional detail — showing "Complemento: No registrado" for the common case (most Tutors won't have one) would be noise on every screen.
- **No existence/format check in the API**, unlike `region`/`comuna` (validated against the Chile catalog) or `speciesId`/`breedId` (validated as foreign keys). There is nothing to validate against — any string or absence of one is valid.
- **Mobile omits an empty value from the payload as `undefined`, not `""`.** Mirrors the existing convention for `Tutor.email` (`email: tutorForm.email.trim() || undefined` in both `tutors/create.tsx` and `tutors/edit.tsx`); `addressComplement` follows the identical pattern for consistency.

## Risks / Trade-offs

- [Free text with no validation could be used to enter something other than a unit detail] → accepted: the user explicitly asked for a plain optional text input with no special behavior, and the field carries no downstream logic (not geocoded, not parsed) — worst case is a display-only string that doesn't match its label, which the vet who reads it can correct via Tutor edit.
- [Adding a display line changes vertical space on Tutor detail and Patient detail] → minor; consistent with how the tablet two-column layout already tolerates variable-height cards (`alignItems: 'flex-start'`), so no layout follow-up is expected.
