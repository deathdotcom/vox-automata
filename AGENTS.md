# Vox Automata - Agent Democracy Arena

## Project Overview

**Vox Automata** is a democratic simulation where AI agents act as citizens, form political parties based on different task-approach philosophies, debate strategies, vote in elections, and execute tasks under elected governance.

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Getting Started

### 1. Setup Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and run the contents of `supabase/schema.sql`
4. Go to Project Settings → API
5. Copy your `Project URL` and `anon public` key

### 2. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Initialize Arena

Open the dashboard at http://localhost:3000 and click "Initialize Arena" to:
- Create 5 default political parties
- Spawn 10 agent citizens

## Features

- **Agent Citizens** — AI agents with ideologies, convictions, and expertise
- **Political Parties** — The Pragmatists, Conservatives, Radicals, Technocrats, Minimalists
- **Democratic Elections** — Full cycle: announcement → platforms → debate → campaigning → voting → execution → review
- **Task Execution** — Winning party executes the task
- **Dashboard** — Real-time monitoring of the democracy

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/agents` | List all agents |
| `POST /api/agents` | Spawn agent(s) |
| `GET /api/parties` | List all parties |
| `POST /api/parties?initialize=true` | Initialize default parties |
| `GET /api/tasks` | List tasks |
| `POST /api/tasks` | Create task |
| `GET /api/elections?action=active` | Get active election |
| `POST /api/elections` | Run full election |

## Architecture

```
lib/
├── supabase.ts         # Supabase client
└── engine/
    ├── agents.ts       # Agent spawning & management
    ├── parties.ts     # Party system
    ├── tasks.ts       # Task management
    └── elections.ts   # Election cycle & voting
```

## License

MIT