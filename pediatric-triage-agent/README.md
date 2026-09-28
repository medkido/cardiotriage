# Pediatric Chest Pain Triage

A decision-support prototype that classifies pediatric chest pain into a risk
tier (high / indeterminate / low) using a red-flag checklist, then asks
Claude to explain the result in plain language. The tier itself is always
computed by deterministic code (`lib/triage.ts`) — the model explains, it
never overrides the classification.

**This is a prototype for demonstration/competition purposes. It is not a
medical device and must not be used for real clinical decisions.**

## How it works

- `lib/triage.ts` — the red-flag checklist (transcribed from the source
  guideline) and the scoring rule: any cardiac red flag present -> high
  risk; no red flags with several reassuring features -> low risk;
  otherwise -> indeterminate.
- `app/api/triage/route.ts` — server route that runs the deterministic
  scoring, then calls the Anthropic API to generate a short plain-language
  explanation constrained by a system prompt that forbids it from changing
  the tier or stating a diagnosis.
- `app/page.tsx` — the intake checklist and results view.

If `ANTHROPIC_API_KEY` is not set, the app still returns the deterministic
tier — it just skips the plain-language explanation.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or run `npx vercel` from inside it to
   deploy directly without GitHub).
2. In the Vercel dashboard: **New Project** → import the repo → Vercel
   auto-detects Next.js, no build settings to change.
3. Under **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from the Claude Console
4. Deploy. Vercel builds and hosts it automatically on every push.

Or from the CLI, once you have the Vercel CLI installed and are logged in:

```bash
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## Adapting the checklist

The entire clinical rule set lives in `lib/triage.ts` as two arrays of
`{ id, label, group }` objects (`CARDIAC_FLAGS`, `REASSURING_FLAGS`) plus the
`computeTriage()` scoring function. To change the guideline logic — add a
flag, change the low-risk threshold, add a new tier — edit that one file;
the form and API route pick up changes automatically since they render the
flag list from the same source.
