# Swarm Coding Skill

Fully autonomous multi-agent software development. Give a plain-English prompt describing an app, and the swarm designs, implements, tests, and delivers a complete project end-to-end.

## How It Works

1. **Orchestrator** (`Planner` role) analyzes your prompt, decides tech stack and architecture, and creates a `swarm.yaml` manifest with tasks and dependencies.
2. **Worker agents** (`BackendDev`, `FrontendDev`, `QA`, `DevOps`) are spawned as sub-sessions. Each has a clear persona and works on its assigned files in a shared workspace.
3. **Coordination**: The orchestrator tracks task completion and dependencies. When a task finishes, it marks it done and starts any unblocked downstream tasks.
4. **Conflict avoidance**: Files are partitioned by role (Backend owns `server/`, Frontend owns `client/`, etc.). If two roles need the same file, the manifest assigns an owner.
5. **Quality gates**: QA must pass tests before integration; DevOps ensures containerization; no merge without green tests.
6. **Deliverable**: You get a complete project directory with README, tests, Dockerfile, and optionally a GitHub repo or zip.

## Usage

```bash
# In your main OpenClaw session, invoke:
/trigger swarm-code "Build a dashboard that shows Moltbook stats and ClawCredit status"
```

The skill will:
- Spawn the orchestrator in an isolated session
- Orchestrator spawns workers sequentially or in parallel (based on dependencies)
- Output a final summary and path to the completed project

## Requirements

- OpenRouter API key with access to `qwen3-coder` (or `qwen-coder` alias)
- Node.js workspace with sufficient disk space
- Internet access for GitHub/Docker (optional, if deployment requested)

## Configuration

Store your OpenRouter key in `.env`:

```
OPENROUTER_API_KEY=sk-or-...
```

The skill exclusively uses `openrouter/qwen/qwen3-coder` for all agents.

## Output

The created project lives in `swarm-projects/<timestamp>/` and includes:
- `README.md` with run instructions
- `package.json` (or equivalent)
- Source code organized by component
- `test/` directory with automated tests
- `Dockerfile` and `docker-compose.yml` (if applicable)
- `CI/` with GitHub Actions workflow (optional)

## Example Prompts

- "Build a Node.js API with Express that serves Moltbook stats from JSON logs"
- "Create a React dashboard with dark theme and charts for ClawCredit status"
- "Make a CLI tool that checks ClawCredit pre-qualification and notifies via desktop alert"
- "Generate a smart contract that holds ClawCredit limits and allows x402 payments"
- "Build a hackathon app: a React dashboard that shows user's token balance using Privy auth" (includes Privy integration out of the box)

## Notes

- The skill makes all decisions autonomously: tech stack, file structure, library choices.
- If a task fails, the orchestrator will retry once with adjusted instructions.
- You can monitor progress via the sub-agent logs in `.openclaw/agents/<agent-id>/sessions/`.
- To stop early, send `/stop` to the orchestrator's session.
- **Privy Integration:** When the prompt mentions blockchain, web3, tokens, NFTs, or Privy, the skill automatically includes Privy authentication and wallet infrastructure. Backend includes `/auth/callback` with JWKS verification and a simulated fallback; frontend integrates `@privy-io/react-auth` if React is used. For advanced agentic wallet controls, see the [Privy Agentic Wallets skill](https://clawhub.ai/tedim52/privy).

Enjoy your autonomous coding factory 🚀
