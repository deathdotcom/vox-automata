# Vox Automata - Project Handoff

## What is Vox Automata?

**Vox Automata** is a Democratic Agent Arena — a simulation where AI agents act as citizens, form political parties with different philosophies, vote in elections, and execute tasks under elected governance.

🔗 **Live URL:** https://vox-automata.vercel.app  
🐙 **GitHub:** https://github.com/deathdotcom/vox-automata  
🗄️ **Database:** Supabase (PostgreSQL)

---

## Current Status

### ✅ Working Features
- 5 Political Parties (The Pragmatists, Conservatives, Radicals, Technocrats, Minimalists)
- 10 Agent Citizens with randomized ideologies
- Democratic Election Cycle (announcement → platforms → debate → campaigning → voting → execution)
- Detailed Election Results (winner, vote breakdown, individual agent votes)
- Task creation and execution
- Real-time dashboard with auto-refresh

### ⚠️ Known Issues
- Old election results (before vote breakdown feature) show basic info only
- No party switching mechanism in UI (only via API)
- No live election phase visualization
- Agents not automatically assigned to parties on initialization (manually assigned)

### 📊 Current Data
- **Agents:** 10 (all assigned to parties)
- **Parties:** 5 (with member counts)
- **Tasks:** 3 (2 completed, 1 failed)
- **Elections:** 2 completed

---

## How It Works

### The Democracy Flow
1. **Create a Task** → Describe a job (e.g., "Fix the login bug")
2. **Run Election** → Triggers democratic process
3. **Voting Phase** → Each agent votes based on their ideology compatibility with party platforms
4. **Winner Executes** → The winning party's philosophy guides task execution

### Agent Ideologies
| Ideology | Prefers Party | Traits |
|----------|---------------|--------|
| Pragmatist | The Pragmatists | Ship fast, iterate fast |
| Conservative | The Conservatives | Stick to proven methods |
| Radical | The Radicals | Always try new approaches |
| Technocrat | The Technocrats | Data-driven, metrics-first |
| Minimalist | The Minimalists | Do the minimum required |

### Vote Calculation
Agents calculate their vote based on:
- **Ideology compatibility** with each party's philosophy
- **Persuadability** factor (higher = more likely to switch)
- **Random factor** (adds unpredictability)

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

### Project Structure
```
vox-automata/
├── app/
│   ├── api/
│   │   ├── agents/route.ts      # Agent CRUD
│   │   ├── parties/route.ts     # Party CRUD
│   │   ├── tasks/route.ts       # Task CRUD
│   │   ├── elections/route.ts  # Election management
│   │   └── votes/route.ts       # Vote tracking
│   ├── page.tsx                 # Main dashboard UI
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── engine/
│       ├── agents.ts            # Agent spawning & management
│       ├── parties.ts           # Party system
│       ├── tasks.ts             # Task management
│       └── elections.ts         # Election cycle logic
├── supabase/
│   └── schema.sql               # Database schema
└── package.json
```

### Key API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Spawn new agent(s) |
| `/api/agents` | PATCH | Assign agent to party |
| `/api/parties` | GET | List all parties |
| `/api/parties` | POST | Create party (or initialize defaults) |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create new task |
| `/api/tasks` | PATCH | Update task status |
| `/api/elections` | POST | Run full election |

---

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Future Features (Ideas)

### Phase 2 - Enhanced Democracy
- [ ] Live election phase visualization (progress bar with current phase)
- [ ] Party performance history tracking
- [ ] Agent trust score evolution over time
- [ ] Debates visible in UI (party platforms displayed)
- [ ] Campaigning phase visualization

### Phase 3 - Advanced Features
- [ ] Real LLM integration (agents use actual AI to decide votes)
- [ ] Multi-issue elections (different task types = different issues)
- [ ] Constitutional conventions (agents can vote on rules)
- [ ] Coalition formation after elections
- [ ] Human voting (humans can join as citizens)

### Phase 4 - Scale
- [ ] Agent spawning from user input (create custom scenarios)
- [ ] Simulation speed control (faster elections)
- [ ] Export election data as CSV/JSON
- [ ] Multi-arena diplomacy (multiple democracies interacting)

---

## How to Continue

### Running Locally
```bash
cd /Users/nasserbadareen/Documents/vox-automata
npm install
npm run dev
```

### Making Changes
1. Edit files in `app/` or `lib/engine/`
2. Commit: `git add -A && git commit -m "Description"`
3. Push: `git push`
4. Vercel auto-deploys from main branch

### Adding a New Feature
1. Update engine logic in `lib/engine/[module].ts`
2. Add API endpoint in `app/api/[module]/route.ts`
3. Update UI in `app/page.tsx`
4. Test locally, then push to deploy

---

## Contact / Notes

- Project created: April 16, 2026
- Built by: AI Assistant (via opencode)
- Owner: Nasser Badareen (@deathdotcom)

---

*Last updated: 2026-04-16*