# Scout

A Next.js 14 App Router travel scouting application with Tailwind CSS and shadcn/ui components.

## Setup and Install

1. Clone the repository:
   ```bash
   git clone https://github.com/Iammony/scout
   cd scout
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Locally

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. App will be at http://localhost:3000/scout

## shadcn/ui Setup

- The repo is configured for shadcn/ui. If you need new components, run:
  ```bash
  npx shadcn@latest add [component]
  ```
- Configuration is in components.json.

## Environment Variables

- To ensure correct time zone handling, set the following in your local `.env` or in Vercel project settings:
  ```env
  TIME_ZONE=Asia/Kolkata
  ```

## API

- The API endpoint `/api/scout` expects POST requests with the scouting form data and will return a standardized travel scouting card JSON.

## Deployment (Vercel)

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "your commit message"
   git push
   ```

2. Import the repository into Vercel (https://vercel.com/new).

3. Framework preset: Next.js

4. Add environment variable `TIME_ZONE=Asia/Kolkata` in project settings.

5. Deploy.

## Extra

- The main travel scouting form is at /scout (app/scout/page.tsx).
- All Next.js and shadcn/ui best practices apply (see shadcn/ui docs for advanced usage).
- For global styling, see styles/globals.css.
