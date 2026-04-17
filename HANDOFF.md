# Vox Automata - Project Handoff

## What is Vox Automata?

**Vox Automata** is a Democratic Agent Arena — a simulation where AI agents act as citizens, form political parties with different philosophies, debate issues, vote in elections, and execute tasks under elected governance.

🔗 **Live URL:** https://vox-automata.vercel.app  
🐙 **GitHub:** https://github.com/deathdotcom/vox-automata  
🗄️ **Database:** Supabase (PostgreSQL)

---

## Current Status (Phase 2 Complete)

### ✅ Working Features
- 5 Political Parties (The Pragmatists, Conservatives, Radicals, Technocrats, Minimalists)
- 10 Agent Citizens with randomized ideologies
- Full Election Cycle (~30 seconds): announcement → platforms → debate → campaigning → voting → execution
- **Live Debate Visualization** - Arguments stream in real-time during debate phase
- **Phase Progress Bar** - Visual indicator of current election phase
- **Rerun Elections** - Re-run completed tasks to see different outcomes
- Detailed Election Results (winner, vote breakdown, debate stats, individual agent votes)
- Auto-refresh dashboard (2s polling)
- Task creation

### ⚠️ Known Issues
- Old election results (before debate feature) show basic info only
- No party switching mechanism in UI
- Election cycle timing may need tuning

### 📊 Current Data
- **Agents:** 10 (all assigned to parties)
- **Parties:** 5 (with member counts)
- **Tasks:** Multiple (mix of completed/pending)
- **Elections:** Multiple completed

---

## How It Works

### The Democracy Flow
1. **Create a Task** → Describe a governance question (e.g., "What is the best method to achieve fair elections?")
2. **Run Election** → Triggers democratic process with 5s per phase
3. **Watch Live** → See phase progress bar and live debate arguments
4. **Voting** → Each agent votes based on ideology compatibility
5. **Results** → Winner announced with full breakdown including debate stats

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
│   │   ├── agents/route.ts
│   │   ├── parties/route.ts
│   │   ├── tasks/route.ts
│   │   ├── elections/route.ts
│   │   ├── arguments/route.ts    # NEW - Debate system
│   │   └── votes/route.ts
│   ├── page.tsx                   # Dashboard with live visualization
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabase.ts
│   └── engine/
│       ├── agents.ts
│       ├── parties.ts
│       ├── tasks.ts
│       ├── elections.ts          # Phase timing: 5s per phase
│       └── arguments.ts          # NEW - Debate generation
├── supabase/
│   └── schema.sql                 # Includes arguments table
└── package.json
```

---

## Phase 2 Features Completed (Today)

1. **Live Election Phase Visualization** - Progress bar showing current phase
2. **Debate System** - Arguments generated during debate phase
3. **Real-time Debate Feed** - Arguments stream in UI during election
4. **Debate Stats in Results** - Shows total arguments, by position, by party
5. **Rerun Elections** - Button to re-run completed tasks

---

## Future Features (Phase 3+)

### Ideas for Next Steps
- Party performance history tracking
- Agent trust score evolution
- Ranked choice voting
- Campaign mechanics (party speeches)
- Memory/history tracking
- Real LLM integration for smarter debates
- Coalition formation

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
- Last work session: April 17, 2026 - Phase 2 debate system added
- Built by: AI Assistant (via opencode)
- Owner: Nasser Badareen (@deathdotcom)

---

*Last updated: 2026-04-17*