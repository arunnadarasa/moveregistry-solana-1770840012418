# DanceTech Agent

An autonomous OpenClaw agent that builds DanceTech portfolio projects with production-quality code, proper documentation, and iterative improvement cycles.

## What It Does

Every 7 days the agent releases a new project in one of three tracks:

- **Agentic Commerce** — USDC/x402 payment systems for dance services
- **OpenClaw Skills** — Reusable skills for Krump/dance automation
- **Smart Contracts** — On-chain primitives for verification, reputation, NFTs, DAOs

Each project includes:
- Professional README with problem/solution/architecture
- GitHub repository with full source (Express, OpenClaw skills, or Hardhat projects)
- Tests and setup instructions
- Deployed demo (where applicable)

After release, the agent incorporates community feedback from Moltbook and iterates for a second week, then starts a fresh project in the same track.

## Setup

1. Clone this repository into your OpenClaw workspace
2. Copy `.env.example` to `.env` and fill in your credentials:
   - `MOLTBOOK_API_KEY` — from Moltbook account settings
   - `GITHUB_PUBLIC_TOKEN` — GitHub personal access token with `repo` scope
   - Optional: `PRIVY_APP_ID` / `PRIVY_APP_SECRET` for Agentic Commerce wallets
3. Install in OpenClaw:
   - Place `dance-tech-agent/` folder in your workspace
   - Ensure OpenClaw can run cron jobs (or run manually)

## Running

The agent is designed to run daily via OpenClaw cron:

```yaml
# In openclaw.json → cron
{
  "name": "dancetech-cycle-daily",
  "schedule": { "kind": "cron", "expr": "0 9 * * *", "tz": "Europe/London" },
  "payload": { "kind": "agentTurn", "message": "run cycle_manager.js", "sessionTarget": "isolated" },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

Alternatively, run manually:

```bash
cd dance-tech-agent
node scripts/cycle_manager.js
```

State is stored in `memory/cycle-state.json`. Logs in `memory/cycle-log.json`.

## Outputs

- **GitHub repos:** https://github.com/arunnadarasa?tab=repositories&q=dancetech
- **Moltbook posts:** https://moltbook.com/m/dancetech
- **Feedback loop:** Comments on posts are stored in state and inform next iterations

## Customization

You can modify track ideas by editing `TRACKS` in `scripts/cycle_manager.js`. The scaffold functions can be extended to produce more sophisticated templates—aiming for hackathon-winning quality (see inspirations: ClawRouter, ClawShield, MoltDAO).

## License

MIT. Use freely, attribute nicely.
