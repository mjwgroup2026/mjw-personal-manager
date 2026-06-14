# Personal Dashboard

A private-first personal dashboard for tasks, habits, projects, finances, and relationships. The first version stores changes in the browser, so it can be explored without accounts or infrastructure.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Push the project to GitHub, import the repository into Vercel, and use the detected Next.js defaults. No environment variables are required for this local-first version.

## Data roadmap

The UI is intentionally separated from the starter data. A later production version can replace browser storage with Supabase, Neon, or another hosted database and add authentication without redesigning the dashboard.
