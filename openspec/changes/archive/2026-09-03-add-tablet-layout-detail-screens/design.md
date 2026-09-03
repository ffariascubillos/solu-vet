## Context

`patients/[id].tsx` and `tutors/[id].tsx` currently render their cards with a plain `StyleSheet.create` stack inside a `ScrollView` (`flexDirection` defaults to column). Neither file, nor anywhere else in `apps/mobile`, uses `useWindowDimensions`, `Dimensions`, or any breakpoint pattern — this is the first responsive layout logic in the app. Both screens share the same shape: an "own record" card followed by one or more "related entity" card(s). See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Introduce one shared, reusable way to detect tablet width, used by both detail screens.
- Rearrange existing cards into rows at tablet width without changing what data each card shows or how it's fetched.

**Non-Goals:**
- Not building a general-purpose grid/breakpoint system for the whole app — just enough to serve these two screens today (create/edit forms, search, home are out of scope for this change).
- Not adding tablet-specific layouts to any screen other than Patient detail and Tutor detail.
- Not changing card content, field lists, or navigation actions (Editar, Agregar mascota, Ver en Maps) — only their arrangement.

## Decisions

- **Shared `useIsTablet()` hook** (`apps/mobile/src/hooks/useIsTablet.ts`), backed by `useWindowDimensions()`, returning `width >= 600` as a boolean. Both screens call this hook and branch their layout on it. Alternative considered: duplicate the `useWindowDimensions` check inline in each screen — rejected because it repeats the same magic number in two files and gives the next tablet-aware screen no obvious place to reuse the logic.
- **600dp breakpoint**: matches Android's own `sw600dp` phone/tablet resource-qualifier convention, rather than an invented threshold. Confirmed with the user.
- **Row wrapper via a plain `View` with `flexDirection: 'row'` and `gap`**, switching to `'column'` below the breakpoint, using React Native's existing flexbox layout (no new dependency, no grid library) — consistent with CLAUDE.md's steer against unnecessary libraries.
- **Unequal-height columns**: the two-column `View` uses `alignItems: 'flex-start'` (not `'stretch'`) so each card sizes to its own content — needed for Tutor detail, where "Mascotas" can grow arbitrarily long next to a short "Datos del tutor" card.
- **Scope: both Patient and Tutor detail**, not just Patient detail as literally named in the roadmap item — confirmed with the user, since both screens share the identical card-stack pattern today and leaving one phone-only would look inconsistent on the same device.

## Risks / Trade-offs

- [A tablet in split-screen or a folded/unfolded foldable can cross 600dp mid-session] → already covered by the "width crosses the breakpoint while the screen is open" scenario in the spec; `useWindowDimensions` re-renders on resize, so no extra handling is needed beyond using the hook's live value (not a one-time read).
- [Two-column row could look cramped on a screen just barely over 600dp] → each column keeps its own `flex: 1` with a shared `gap`, and card padding/text sizes are unchanged from today, so this matches the existing phone card width at the narrow end of tablet range; no separate mid-size breakpoint is introduced for this change.
