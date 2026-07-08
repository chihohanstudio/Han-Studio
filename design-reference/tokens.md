# Design Tokens — extracted from design-system.fig

Source of truth: Figma Variables in `design-system.fig` (Components page + variable sets).
Implemented in `tailwind.config.ts`.

## Typography

- UI: **Inter** (400/500/600/700) — body 12–14px, titles Bold 16/18/24, page titles Bold 32–36
- Brand serif: **Crimson Text** (400, italic) — login hero 96px, subtitle italic 36px, logo "H" italic

## Neutrals (warm)

| Token | Hex |
| --- | --- |
| neutral/0 | #ffffff |
| neutral/50 (bg/page) | #fafaf8 |
| neutral/100 (bg/subtle) | #f4f3f0 |
| neutral/200 (border/default) | #e6e3dd |
| neutral/300 (border/strong) | #d1ccc3 |
| neutral/500 (text/muted) | #78736a |
| neutral/700 (text/secondary) | #3f3b36 |
| neutral/900 (text/primary) | #181614 |

## Action

- action/primary `#1c1c1c`, hover `#000000`, soft `#f1f1f1`, text `#ffffff`
- border/focus `#1c1c1c`

## Status badges (bg / text / border)

| Status | bg | text | border |
| --- | --- | --- | --- |
| open | #eaf7ef | #1f6b3d | #b8e3c7 |
| booked | #eef2f7 | #35516f | #cad6e4 |
| mine | #f1f1f1 | #1c1c1c | #bdbdbd |
| completed | #f4f3f0 | #78736a | #d1ccc3 |
| pending | #f5edff | #5a3d8a | #dcc7ff |
| cancelled / danger | #fdecec | #9f2a2a | #f0b7b7 |
| warning | #fff6da | #7a5600 | #ecdfae |

- danger solid (buttons): red/500 `#b54545`

## Radii

- Pills (badges, icon buttons, avatars): 999px
- Cards & lesson rows: 12px
- Buttons: 10px
- Inputs & logo mark: 8px

## Component map (Figma → code)

| Figma component | Code |
| --- | --- |
| Button-Text (Primary/Secondary/Danger/Disabled) | `components/ui/button.tsx` |
| Button-Icon (circular) | `components/ui/icon-button.tsx` |
| Badge (Open/Booked/Mine/Completed/Pending/Cancelled/…) | `components/ui/badge.tsx` |
| Form Field (Default/Focus/Error/Disabled) | `components/ui/form.tsx` |
| Lesson Slot Row + Lesson Day Header/Section | `components/lessons.tsx` |
| Page Header (+ action button) | `components/ui/page-header.tsx` |
| Top Bar / App Group / Term Label / User Profile Block | `components/app-shell.tsx` |
| Sidebar Item (Default/Active) | `components/nav-links.tsx` |
| Student Card (progress bar rows) | `app/admin/students/page.tsx` |
| Avatar | `components/ui/avatar.tsx` |
| Logo/Default ("H" serif mark) | `components/logo.tsx` |
