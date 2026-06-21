# MJW Signal — CLAUDE.md

## Architecture

| Concern | Detail |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript 5.7.2, strict mode |
| Auth | NextAuth.js 4 — Credentials provider; JWT session; users from Supabase `mjw_users` table or `USERS` env var fallback |
| Database | Supabase (`mjw_user_data` key-value table) + localStorage fallback via `lib/useUserData.ts` |
| Styling | Vanilla CSS (`app/globals.css`) — CSS variables for theming, dark mode via `.app.dark` class |
| Icons | lucide-react 0.468 |
| Deployment | Vercel (no vercel.json; Next.js defaults) |
| PWA | `public/manifest.json` added in Sprint 1 |

## Key files

- `app/layout.tsx` — root layout, PWA manifest, viewport meta
- `app/globals.css` — all styles; design tokens in `:root` and `.app.dark`
- `components/Dashboard.tsx` — entire app shell, all views
- `components/MjwLogo.tsx` — logo component; loads `/brand/mjw-logo.png` with SVG fallback
- `components/sections/` — per-section view components
- `lib/useUserData.ts` — dual Supabase + localStorage persistence hook
- `lib/types.ts` — all entity types
- `public/brand/mjw-logo.png` — canonical logo (copied from local in Sprint 1)

## Logo

The canonical logo lives at `/public/brand/mjw-logo.png` and is served at `/brand/mjw-logo.png`.
**Never reference** `C:\Users\Morna\Downloads\mjw-logo.png` in source code.

## Design tokens (dark mode — `.app.dark`)

```css
--bg: #0A0A0F
--surface: #12121A
--surface-2: #1E1E28
--text: #F0EFE9
--muted: #8A8A9A
--line: rgba(255,255,255,0.09)
--accent: #e66e52
--accent-dark: #ff8a72
```

## Commands

```bash
npm run dev       # local dev server
npm run build     # production build
npm run typecheck # tsc --noEmit (if configured)
npm run lint      # eslint
```

## Sprint 1 — completed (2026-06-21)

- [x] Logo copied to `/public/brand/mjw-logo.png`
- [x] `MjwLogo.tsx` updated to `/brand/mjw-logo.png`
- [x] No Windows path references in source
- [x] `public/manifest.json` created (PWA)
- [x] `app/layout.tsx` — manifest link, viewport, theme-color, apple-web-app meta
- [x] Dark mode tokens upgraded to premium palette
- [x] Mobile bottom navigation (Today / Tasks / Money / Calendar / Settings)
- [x] MJW logo shown in mobile topbar
- [x] Keyboard focus rings added globally
- [x] CSS transition variable (`--transition: 300ms ease`) applied

## Sprint 2 — next recommended

- Document Vault shell with upload + category filter
- Contacts shell with emergency contact section
- Appointment Logger shell
- Medication Tracker shell (neutral language only — no medical advice)
- Budget Tracker upgrade
- Project Tracker Kanban-ready data model
- Empty states and mock data guards
- Supabase RLS policies if not yet in place

## Known limitations

- PWA icons: only one icon entry (the logo PNG). For best install prompt support, generate dedicated 192×192 and 512×512 PNGs from the logo and add them to `public/brand/`.
- No service worker yet — offline fallback not implemented.
- `public/mjw-logo.png` (old root-level copy) still exists; safe to delete once no other references remain.
- Search box in topbar is UI-only (no search logic wired).
