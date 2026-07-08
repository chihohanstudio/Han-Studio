# Chi Ho Han Studio Frontend

Clean static frontend prototype for the Chi Ho Han Studio Scheduling site.

This folder is the active design/prototype workspace. It does not use Next.js, Supabase, npm, pnpm, or any backend service.

## Files

- `index.html` - page structure and sample data
- `styles.css` - visual design, layout, responsive behavior
- `app.js` - small local interactions, currently sidebar view switching

## Preview

Open directly in a browser:

```text
/Users/zhouding/Downloads/studio2.0/static-prototype/index.html
```

Or serve locally:

```bash
cd /Users/zhouding/Downloads/studio2.0/static-prototype
python3 -m http.server 4174
```

Then open:

```text
http://127.0.0.1:4174
```

## Current State

Built:

- Top bar
- Sidebar navigation
- Lessons page
- Lesson day headers
- Grouped lesson slot rows
- Status badges
- Circular icon buttons
- Responsive layout for smaller screens

Placeholders:

- Dashboard
- Studio Class
- Students
- Announcements

## Related Folders

The parent project also contains:

- `figma-frontend/` - previous static prototype
- `app/`, `components/`, `lib/`, `supabase/` - current Next.js + Supabase app
- `node_modules/` - local dependencies

For the current app design pass, edit the Next.js app in `/Users/zhouding/Downloads/studio2.0`.
