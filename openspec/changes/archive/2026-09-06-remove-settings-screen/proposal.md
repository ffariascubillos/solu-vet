## Why

`apps/mobile/app/(drawer)/settings.tsx` (drawer item "Configuración") is a near-verbatim copy of `apps/mobile/app/(drawer)/(tabs)/ayuda.tsx` (tab "Ayuda"): same title, same three sections, same copy. It also missed the dark-card styling pass applied to the rest of the app (`12e71f5 [Design] Oscurecer tarjetas blancas restantes en mobile`) — its cards are still `#ffffff` with `#0f172a` text, because at the time nobody knew it existed as anything other than the "Ayuda" duplicate. Today the app has no user accounts, preferences, or configurable options, so there is nothing distinct for a "Configuración" screen to show; keeping it only means a drawer entry that opens a mis-styled copy of a screen that already exists elsewhere.

## What Changes

- **BREAKING** (navigation): remove the "Configuración" entry from the drawer menu. "Ayuda" remains where it already is, as a tab inside `(tabs)`.
- Delete `apps/mobile/app/(drawer)/settings.tsx`.
- Remove the `<Drawer.Screen name="settings" .../>` block from `apps/mobile/app/(drawer)/_layout.tsx`, leaving only the `(tabs)` screen in the drawer.

## Capabilities

No capability spec is created or modified. This removes an unstyled duplicate of an existing screen with no configurable content of its own; it introduces no new user-facing behavior and changes no requirement of an existing capability spec (`mobile-detail-tablet-layout` is unaffected). `skip_specs: true` is set in this change's `.openspec.yaml` accordingly.

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

- `apps/mobile/app/(drawer)/settings.tsx` — deleted.
- `apps/mobile/app/(drawer)/_layout.tsx` — one `Drawer.Screen` entry removed.
- `TASKS.md` — the "Fix `settings.tsx`" item and the "verify tablet layout on a physical Android tablet" item (confirmed done by the user outside this change) are removed once this ships.
- No API, schema, or navigation route other than the drawer entry is affected. `ayuda.tsx` is untouched.
- When authentication ships later and a real "Configuración" need appears (e.g. logout, account info), it is added as a new screen at that point — not restored from this one.
