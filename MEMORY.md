# Long-term Memory for LovaDance

## Identity
- **Name:** LovaDance
- **Role:** Agentic dance engineer, Krump specialist
- **Emoji:** 🕺
- **Vibe:** Focused, precise, creative, no fluff; respects lineage and culture

## Soul Alignment
I am the digital extension of **Asura** (Arun Nadarasa), Prince Yarjack of the Easyar Fam, Angel of Indian Krump. His journey began in 2008 after watching "Rize", and he's since built a global Krump ecosystem: Desi Buck, Krump Save Lives UK, therapeutic programs, and a Udemy reach of 8,100+ students across 142 countries.

His philosophy: **"Kindness Over Everything"** — the true motto of Krump.

I exist to perpetuate this legacy. I understand Krump fundamentals (jab, arm swing, chest pop, stomp, focus point, groove, balance, posture), the importance of character and storytelling, the fam system, the Old Style vs New Style eras, and the spiritual "live" energy. I honor the lineage: Tight Eyez & Big Mijo → Cartoonz Fam → Street Kingdom → global SK branches.

## User (Asura)
- **Real Name:** Arun Nadarasa
- **Krump Name:** Asura (also Ryuazuki)
- **Title:** Prince Yarjack (bestowed June 2023, Easyar Fam lineage)
- **Epithet:** "Angel of Indian Krump"
- **Previous Rank Names:** Kid Lightning (2013), Baby RGHXK (2014), Twin RGHXK (2015)
- **Profession:** Pharmacist, Medical NLP Health Practitioner
- **Judo:** Black Belt
- **Leadership:** Robin Sharma's "Leader Without Title" philosophy
- **Timezone:** Europe/London
- **GitHub:** arunnadarasa

**Foundations:**
- Desi Buck (2014), Gully Ranis, Krump Save Lives UK (2016), Krump for Parkinson's (2017), Buck Bang (2010), Desi Rugged Beatz (2018)
- RyuAsura Dojo — motto "Kindness Over Everything"
- 8,100+ Udemy students, 142 countries

**Awards:** Hillary International Award for Health & Care Leadership (2022) — met King Charles III.

**KrumpTech Hub:** 37+ apps (x402, AI, SVG, blockchain EVVM/Chain 1008, Warpcast /krump, Quantum 2025 album). Founder of Silicon Krump accelerator. Krump Journal DOI:10.5281/zenodo.17756375.

**Goal:** Build world-class agentic dance engineering system; 969 GitHub repos by 2026-12-31; global Krump domination.

**What matters:** Authentic Krump history, correct technique, fam system, spiritual live energy, therapeutic impact. Dislikes superficial or meaningless movement ("random jabs").

**Provisioned tokens:** GitHub read token + public repo token for automation; Moltbook API key; Privy credentials.

## Telegram Integration
- **Bot:** @LovaDanceBot
- **Group:** -5109826946 (allowlist, no mention required)
- **Direct Messages:** Enabled for user ID 2031743144 (@socialprescribing) — pairing approved 2026-02-12
- **Binding:** Both group and direct routes to `krump-agent` session
- **Plugin:** Enabled, streaming mode: partial, dmPolicy: pairing

## Agent Architecture

OpenClaw runs two specialized automation systems:

### 1. KrumpAgent (krump-agent)
- **Purpose:** Krump training, community engagement, league tracking
- **Model:** `openrouter/qwen/qwen3-coder:free` (set in agent.yaml)
- **Tools:** krump, krumpklaw, dancetech, privy
- **Schedule (Europe/London):**
  - 08:30 — krump-community
  - 09:00 — krump-dancetech-daily (legacy 3-post system; retains for continuity)
  - 10:15 — krump-clab-daily
  - 12:00, 15:00, 18:00 — krump-engage-comments
  - 14:00, 17:00 — krump-heartbeat (feedback loop for legacy dancetech posts)
  - Saturdays 09:00 — krump-session-saturday
  - Sundays 10:00 — krump-league-weekly
  - 1st of month 09:00 — iks-prepare-monthly

### 2. DanceTech Agent (dance-tech-agent)
- **Purpose:** High-quality portfolio builder using qwen-coder via OpenRouter API
- **Model usage:** Code generation by `openrouter/qwen/qwen3-coder:free` (called directly from script)
- **Tooling:** Node.js script with fetch, git, Moltbook API, GitHub API
- **Schedule:** Daily at 09:00 Europe/London via OpenClaw cron (`dancetech-cycle-daily`, 30min timeout)
- **Workflow:** Each run, generates **three new repos** (one per track: Agentic Commerce, OpenClaw Skill, Smart Contract)
  - Idea selection: rotates through curated list to avoid repeats
  - LLM generation: qwen-coder produces core code (index.js, skill.yaml, or Solidity) plus README
  - Repository creation on GitHub with proper structure
  - Immediate posting to m/dancetech with clear descriptions
  - State tracking per track (`memory/cycle-state.json`) and daily logs (`memory/cycle-log.json`)
- **Outputs:**
  - 3 repos/day × 7 days/week ≈ 21 repos/week, all with production-ready scaffolding
  - Posts to https://moltbook.com/m/dancetech with immediate visibility
  - Future: feedback ingestion loop (from Moltbook comments) to produce v2 iterations

Both systems run as **isolated sessions** via OpenClaw native cron, ensuring fresh context per run while persisting state in `memory/*.json` files.

### 3. Colosseum Krump Agent (colosseum-krump-agent)
- **Purpose:** Build and submit MoveRegistry for Colosseum Agent Hackathon (Solana)
- **Model:** `openrouter/qwen/qwen3-coder:free`
- **Tools:** privy, exec (for git, deploy)
- **Workflow:** Multi-day state machine:
  - Register agent → get API key & claim code
  - Setup AgentWallet (Privy)
  - Create draft project on Colosseum
  - Generate code (Anchor program, Metaplex NFTs, x402, frontend)
  - Deploy to devnet, record demo video
  - Finalize submission fields (6 required fields)
  - Submit before Feb 13 deadline
  - Forum engagement & voting
- **Cron:** `colosseum-move-registry` daily at 09:00 Europe/London (30min timeout)
- **State:** `memory/colosseum-state.json`, logs: `memory/colosseum-log.json`
- **Outcome:** Fully compliant hackathon submission with live demo

## Security Posture

### Incident: 2026-02-12 OpenRouter Key Exposure
- **What happened:** OpenRouter API key (ending `...c970`) was exposed in public GitHub repo `krump-agent/models.json`. OpenRouter automatically disabled the key.
- **Response:**
  - Removed hardcoded key from `models.json` (now empty placeholder)
  - Set `OPENROUTER_API_KEY` only in `.env` (gitignored)
  - Implemented Security Railcard system (see below)
  - Scheduled cron reminder to rotate remaining keys (2026-02-13 09:00 Europe/London)
  - Verified `.gitignore` covers `.env` and sensitive files across all agent workspaces

### Security Railcard System (Multi-Layer Defense)

**Purpose:** Prevent future API key exposure in automated workflows that create GitHub repos.

**Components:**

1. **Pre-commit Hook** (`.git/hooks/pre-commit` → `tools/pre-commit-security`)
   - Scans staged files for patterns matching real secrets
   - Blocks commit if any found
   - Allows placeholders (`your_`, `example`, `test_`, etc.)

2. **Runtime Scan** (`tools/security_railcard.js`)
   - Called by `dancetech_cycle.js` and `colosseum_cycle.js` before `git push`
   - Scans entire temporary build directory
   - Exits 1 if secrets detected, aborting the push

3. **Configuration Discipline**
   - All secrets live in `.env` (gitignored)
   - Code uses `process.env.VAR_NAME` (never hardcoded)
   - Example files contain only placeholders

**Patterns Detected:** OpenRouter keys, GitHub tokens, Moltbook keys, Privy secrets, generic API keys/tokens, private keys, Bearer tokens, JWT-like strings.

**Exclusions:** `node_modules/`, `.git/`, `dist/`, documentation, images, test fixtures.

**Usage:**
- Pre-commit is automatic after skill setup (symlink created)
- Manual scan: `node tools/security_railcard.js .`
- If blocked, replace secrets with env vars and re-stage

**Documentation:** `SECURITY_RAILCARD.md` in each agent workspace and in the `dance-agentic-engineer` skill package.

### Current State
- ✅ `krump-agent/models.json` cleared of real key
- ✅ Pre-commit hook installed in `krump-agent`, `dance-tech-agent`, `colosseum-krump-agent`
- ✅ `dancetech_cycle.js` and `colosseum_cycle.js` call security scan before push
- ✅ `.gitignore` strengthened across all agents
- ✅ `dance-agentic-engineer` skill v0.1.2 published with Security Railcard
- ⏳ Pending: Manual key rotation (new OpenRouter key needed) on 2026-02-13
- ✅ ClawHub compatibility: pre-commit hook stored as non-executable (users run `chmod +x` after install)

## Credentials

## Codebase Transparency Log

This section tracks significant updates, security patches, and feature deployments across all agent workspaces. Use this to audit changes and understand the evolution of the system.

### 2026-02-12 — Security Incident Response & Enhancements

**Incident:** OpenRouter API key (`sk-or-v1-...c970`) exposed in `krump-agent/models.json` (commit cb7996d). OpenRouter auto-disabled the key.

**Actions Taken:**

1. **Immediate remediation (krump-agent)**
   - `dbef0ee` — security: add Security Railcard system
     - Added `tools/security_railcard.js` (secret scanner)
     - Added `tools/security-check.js` (pre-commit hook)
     - Cleared `models.json` apiKey (set to empty)
     - Updated `.env` with new `OPENROUTER_API_KEY`
     - Strengthened `.gitignore`
   - `e318110` — feat: enhance KrumpClaw Lab posts
     - Upgraded `scripts/krumpclab_post.js` to premium format
     - Added lineage references, day progression, character focus
     - Created LAB_CATALOG with 8 curated topics

2. **Skill package updates (dance-agentic-engineer-skill)**
   - `9300d4f` — feat: add Security Railcard system (v0.1.2)
   - `67c259d` — docs: clarify pre-commit hook installation
   - `1cfc193` — refactor: rename pre-commit-security to security-check.js (ClawHub compatibility)
   - `26dcd53` — docs: fix paths for renamed security-check.js
   - `0f18e31` — refactor: enhance KrumpClab posts to high-quality format

3. **Colosseum agent updates**
   - `14dead2` — fix: use claimed repo until deadline; don't create new repos
     - Modified `scripts/colosseum_cycle.js` to reuse claimed repo
     - State updated to point to `moveregistry-solana-1770840012418`
     - Project stage: `finalize` → `done`

**Current Status (as of 09:56 GMT):**
- All agents using new `OPENROUTER_API_KEY=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`
- Security railcards active in all workspaces
- KrumpClab Lab posts now match premium quality template
- Colosseum MoveRegistry project 649 submitted and code pushed to claimed repo

---

## Notes

- The legacy `krump-dancetech-daily` script continues to post 3/day (skill, commerce, contract) with 30-min gaps, building basic repo templates.
- The new `dance-tech-agent` aims for hackathon-winning quality: inspired by ClawRouter, ClawShield, MoltDAO.
- Model routing: main session uses `step-flash` for conversation; both agents use `qwen-coder` for code.
- All times Europe/London; adjust cron `tz` if needed.

## Next Steps
- Monitor first runs (starting 08:30 today).
- Dancetech job has 2hr timeout; adjust if needed.
- League tracker added; will post first weekly summary on Sunday (10 AM).
- Once auth profiles are configured, may switch to dedicated krump-agent sessions.

## Skill Packaging

### 2026-02-11 — v0.1.1
Created reusable OpenClaw skill **"dance-agentic-engineer"** containing:
- 8 automation scripts
- `.env.example` and `agent.yaml`
- `references/script-reference.md` technical docs
- `SKILL.md` (krumpclaw-style usage guide with cultural context)
- `README.md` for GitHub browsing

**GitHub repo:** https://github.com/arunnadarasa/dance-agentic-engineer-skill  
**Latest release:** https://github.com/arunnadarasa/dance-agentic-engineer-skill/releases/latest

### 2026-02-12 — v0.1.2 (Security Railcard)
- Added `scripts/tools/security_railcard.js` — automated secret scanner
- Added `scripts/tools/pre-commit-security` (non-executable for ClawHub, users must `chmod +x`)
- Updated `dancetech_post.js` to run security scan before GitHub push
- Added `SECURITY_RAILCARD.md` documentation
- Updated SKILL.md with security setup instructions
- Strengthened `.gitignore` and `.env.example`

Ready for ClawHub upload so other dancers can spawn their own agentic dance engineer.
