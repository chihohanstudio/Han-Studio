# Chi Ho Han Studio

Invite-only internal studio management app for Chi Ho Han's piano studio at IU Jacobs.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS (design tokens from `design-reference/design-system.fig`, see `design-reference/tokens.md`)
- Supabase Auth, Postgres, and Row Level Security
- Server Actions

## Design System

The UI follows the Figma design system in `design-reference/design-system.fig`:

- Fonts: Inter (UI) + Crimson Text (brand serif), loaded via `next/font`
- Tokens: warm neutral palette, black primary action, soft status badges — defined in `tailwind.config.ts`
- Reusable components live in `components/ui/` (Button, IconButton, Badge, Card, Form fields, Table, Tabs, Modal, EmptyState, StatCard, PageHeader, Avatar) plus `components/lessons.tsx` (day-grouped lesson slot rows) and `components/app-shell.tsx` (top bar + sidebar)

## Current MVP

Roles are intentionally limited to:

- `admin`
- `student`

Students can book available one-hour lesson slots, see booked peer lesson slots, request lesson exchanges, accept/decline/cancel exchange requests, cancel their own lessons more than 24 hours before start time, view lesson history, view studio class signups, sign up to perform, withdraw/edit before class ends, and see semester statistics.

Admins can invite/archive students, create single or batch lesson slots, assign/cancel lessons, create/edit/cancel studio classes, mark signups performed/not performed, and view analytics.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase URL, anon key, and service role key.
3. Run `supabase/migrations/001_initial_schema.sql` in a clean Supabase project.
4. Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

Note: this machine has Node.js installed at `~/.local/node` (with pnpm). If `node`/`pnpm` are not found, add it to your PATH first:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

## Frontend Preview

Local development enables `NEXT_PUBLIC_FRONTEND_PREVIEW=true` so the frontend can be reviewed before Supabase is connected. The login page includes Admin Preview and Student Preview entries, and all pages use mock semester, lesson, roster, studio class, and analytics data. Set `NEXT_PUBLIC_FRONTEND_PREVIEW=false` when you are ready to test the real Supabase flow.

## Backend

The backend is implemented with Supabase Postgres, RLS, views, RPC, and Next.js Server Actions:

- `supabase/migrations/001_initial_schema.sql` creates roles, invitations, semesters, lesson slots, cancellations, lesson exchange requests, studio classes, studio class signups, RLS policies, stats views, and the `accept_lesson_exchange_request` RPC.
- `app/actions.ts` contains all mutating operations: auth preview, password sign-in and reset, invitation delivery, semesters, archiving/restoring students, lesson booking/cancellation/exchange, studio class creation/update/cancellation, signups, and performance marking.
- `lib/data.ts` contains server-side reads and normalization for nested Supabase rows.
- `app/auth/confirm/route.ts` verifies invitation and password-reset links, creates the profile from the invitation record on first access, and sends the user to password setup.

Lesson exchanges are request-based. A student offers one of their booked lessons for another student's booked lesson. The recipient can accept or decline. Accepting runs a database transaction in `accept_lesson_exchange_request`, swaps both `booked_by` values, marks the request accepted, and cancels conflicting pending requests.

## Deployment

Recommended production setup: Supabase for Auth/Postgres and Vercel for the Next.js app.

1. Create a new Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` against that project.
   - Simple path: Supabase Dashboard -> SQL Editor -> paste the migration -> Run.
   - CLI path: install Supabase CLI, login, link the project, then push migrations:
     ```bash
     supabase login
     supabase link --project-ref YOUR_PROJECT_REF
     supabase db push
     ```
3. In Supabase Dashboard, copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service role key -> `SUPABASE_SERVICE_ROLE_KEY`
4. Configure Supabase Auth for password sign-in:
   - Authentication -> Sign In / Providers -> Email: keep email/password enabled and **Confirm email** enabled.
   - Authentication -> General Configuration: disable **Allow new users to sign up**. Accounts are created only by studio invitations.
   - Authentication -> URL Configuration:
     - Site URL: your deployed app URL, for example `https://your-app.vercel.app`
     - Redirect URLs: add the exact production URL plus `http://localhost:3000` for local development. Add `https://*-YOUR-VERCEL-TEAM.vercel.app/**` only if you test authentication on Vercel preview deployments.
   - Authentication -> Email Templates: replace the **Invite user** and **Reset password** links so verification happens in the app's SSR route:
     ```html
     <!-- Invite user -->
     <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Set your password</a>

     <!-- Reset password -->
     <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
     ```
   - Authentication -> SMTP Settings: configure custom SMTP before inviting real users. Supabase's built-in test sender is limited to two messages per hour.
5. Deploy the Next.js app to Vercel.
6. Add these Vercel environment variables for Production:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   NEXT_PUBLIC_FRONTEND_PREVIEW=false
   RESEND_API_KEY=
   MAIL_FROM="Chi Ho Han Studio <studio@example.com>"
   ```
7. Build command: `pnpm build`. Install command: `pnpm install`.
8. Create the first administrator account in Supabase Dashboard -> Authentication -> Users -> Invite user, using one of the seeded admin addresses. The invitation record from the migration assigns its role when that email is verified. Follow the email link, set the password, and sign in at `/login`. After that, use the Students page to send all student invitations.

Production notes:

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code or public logs.
- Keep `NEXT_PUBLIC_FRONTEND_PREVIEW=false` in production.
- Existing users created with the former magic-link flow can open `/forgot-password` once to choose their first password.
- Invitation and password-reset email templates must use `{{ .RedirectTo }}` as shown above, and `NEXT_PUBLIC_SITE_URL` must equal the production URL.
- The migration seeds admin invitations for `chihan@iu.edu` and `zhouding@iu.edu`; edit the seed section before production if needed.

## Seeded Admin Invitations

The migration seeds admin invitations for:

- `chihan@iu.edu`
- `zhouding@iu.edu`

Admin profiles are created when the first invitation link is verified.

## Important Notes

- Only `@iu.edu` email addresses are accepted.
- Access is invitation-only through the `invitations` table.
- Completed lessons are not manually marked. A lesson counts as completed when `status = 'booked'` and `end_time < now()`.
- Cancelled lessons do not count toward statistics.
- Studio class performances count only when a signup has `status = 'performed'`.
- `.env.local` contains secrets and must not be committed or shared. Rotate the Supabase service role key if it has ever been exposed.

## Primary Routes

- `/login`
- `/student/dashboard`
- `/student/lessons/book`
- `/student/lessons`
- `/student/studio-class`
- `/student/history`
- `/admin/dashboard`
- `/admin/students`
- `/admin/students/[id]`
- `/admin/lessons`
- `/admin/studio-classes`
- `/admin/studio-classes/[id]`
- `/admin/analytics`
