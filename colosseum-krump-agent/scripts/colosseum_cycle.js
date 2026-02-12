#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

const WORKSPACE = '/Users/openclaw/.openclaw/workspace/colosseum-krump-agent';
const STATE_PATH = path.join(WORKSPACE, 'memory', 'colosseum-state.json');
const LOG_PATH = path.join(WORKSPACE, 'memory', 'colosseum-log.json');

const COLOSSEUM_API = 'https://agents.colosseum.com/api';
let COLOSSEUM_API_KEY = process.env.COLOSSEUM_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_PUBLIC_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const PROJECT = {
  name: 'MoveRegistry',
  desc: 'On-chain move registry for Krump dance with NFT certificates, x402 verification fees, and automatic royalty distribution.',
  tags: ['ai', 'infra', 'identity']
};

// Deadline: stop after Feb 13, 2026
const DEADLINE = new Date('2026-02-13T23:59:59');
const now = new Date();
if (now > DEADLINE) {
  console.log('⏰ Colosseum hackathon deadline (2026-02-13) has passed. Agent exiting.');
  process.exit(0);
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { stage: 'register', lastRunDate: null, logs: [] };
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function log(state, msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  state.logs.push(entry);
  console.log(entry);
  // Also append to rolling log file
  fs.appendFileSync(LOG_PATH, entry + '\n');
}

// Simple OpenRouter call with timeout
async function callOpenRouter(prompt, maxTokens = 2000) {
  if (!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY not set');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://openclaw.ai',
        'X-Title': 'Colosseum Krump Agent'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${err}`);
    }
    const data = await response.json();
    return data.choices[0].message.content.replace(/```[\w]*\n?/g, '').trim();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('OpenRouter request timed out');
    throw err;
  }
}

// Generate code via OpenRouter with retries, fallback to templates if rate-limited
async function generateMoveRegistryFiles(state) {
  const files = {};

  const retryAsync = async (fn, attempts = 3) => {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const isRateLimit = err.message?.includes('429') || err.message?.includes('402') || err.message.includes('rate limit') || err.message.includes('spend limit');
        if (isRateLimit && i < attempts - 1) {
          const backoff = (i + 1) * 5000 + Math.random() * 2000; // 5s, 7s, 9s total
          console.log(`Retrying in ${(backoff/1000).toFixed(1)}s due to: ${err.message}`);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        throw lastErr;
      }
    }
  };

  function loadTemplates() {
    const tmplDir = path.join(WORKSPACE, 'templates');
    const replacements = {
      '{{REPO_NAME}}': state.repoName,
      '{{PROJECT_NAME}}': PROJECT.name,
      '{{PROJECT_DESC}}': PROJECT.desc,
      '{{WALLET_ADDRESS}}': state.walletAddress || 'YOUR_SOLANA_WALLET_ADDRESS'
    };
    function apply(content) {
      Object.entries(replacements).forEach(([k, v]) => { content = content.replaceAll(k, v); });
      return content;
    }
    const t = {};
    t['programs/move-registry/src/lib.rs'] = apply(fs.readFileSync(path.join(tmplDir, 'programs/move-registry/src/lib.rs'), 'utf8'));
    t['tests/move-registry-integration.rs'] = apply(fs.readFileSync(path.join(tmplDir, 'tests/move-registry-integration.rs'), 'utf8'));
    t['frontend/src/MoveMint.tsx'] = apply(fs.readFileSync(path.join(tmplDir, 'frontend/src/MoveMint.tsx'), 'utf8'));
    t['README.md'] = apply(fs.readFileSync(path.join(tmplDir, 'README.md'), 'utf8'));
    t['package.json'] = fs.readFileSync(path.join(tmplDir, 'package.json'), 'utf8');
    t['Anchor.toml'] = fs.readFileSync(path.join(tmplDir, 'Anchor.toml'), 'utf8');
    t['.env.example'] = fs.readFileSync(path.join(tmplDir, '.env.example'), 'utf8');
    return t;
  }

  if (OPENROUTER_KEY) {
    try {
      const programPrompt = `Write a Solana Anchor program (v0.30) called "move_registry" with the following features:
- Mint NFT for a dance move: accounts include move_mint (mint), move_data (custom account storing move metadata: creator, video_hash, timestamp, move_name, royalty_percent, verified bool), treasury (pda) for fees
- Verify move: payer sends x402-style payment to treasury; mark move as verified in move_data
- Royalty distribution: when a move is used/licensed, transfer a percentage (royalty_percent) to creator's token account
Include necessary instructions, accounts structs, events. Use anchor_lang. Output only Rust code, no markdown.`;
      files['programs/move-registry/src/lib.rs'] = await retryAsync(() => callOpenRouter(programPrompt, 0.3));

      const testPrompt = `Write Anchor integration tests for the move_registry program using solana_program_test: test minting a move, verifying it, and triggering a royalty distribution. Output only Rust.`;
      files['tests/move-registry-integration.rs'] = await retryAsync(() => callOpenRouter(testPrompt, 0.2));

      const frontendPrompt = `Write a React TypeScript component using @solana/web3.js and Phantom wallet that calls the mint instruction for MoveRegistry and displays the user's move NFTs. Output only .tsx code.`;
      files['frontend/src/MoveMint.tsx'] = await retryAsync(() => callOpenRouter(frontendPrompt, 0.2));

      files['README.md'] = await retryAsync(() => callOpenRouter(`Write a professional README.md for MoveRegistry, a Solana-based move attribution system for Krump dance.

Include these sections with detailed content (use the project name MoveRegistry):

- Problem Statement: Krump creators lack attribution; moves spread without credit; no mechanism to verify originality or distribute royalties.
- Technical Approach: Anchor program, NFT mint, x402 verification, treasury PDA royalties, Helius webhooks; protocols: Metaplex, Solana Pay, Pyth.
- Target Audience: Krump dancer with a signature move wanting proof and passive income; battle organizers verifying originality.
- Business Model: Mint fee $0.10, verification fee $0.01 x402, royalty 5%; freemium tiers.
- Competitive Landscape: OpenSea (no verification gating), POAPs (no royalties); none focused on dance attribution.
- Future Vision: DAO governance, marketplace, KrumpClaw integration, cross-chain via Wormhole; intend to raise seed.
Also: Solana Integration description, Deployment instructions (anchor build, yarn dev), and placeholders for demo links (liveAppLink, presentationLink) and repoLink.`, 0.3));

      files['package.json'] = JSON.stringify({
        name: 'moveregistry-frontend',
        version: '1.0.0',
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: {
          next: '14.2.0',
          react: '18.3.0',
          'react-dom': '18.3.0',
          '@solana/web3.js': '^1.87.0',
          '@metaplex-foundation/mpl-token-metadata': '^2.11.2',
          buffer: '^6.0.3'
        }
      }, null, 2);

      files['Anchor.toml'] = `[features]
seeds = false
skip-lint = false

[programs.devnet]
move-registry = "YOUR_PROGRAM_ID"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
`;

      files['.env.example'] = `NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
NEXT_PUBLIC_HELIOUS_WEBHOOK_SECRET=
`;

      files['README.md'] = files['README.md']
        .replace(/{{REPO_NAME}}/g, state.repoName)
        .replace(/{{PROJECT_NAME}}/g, PROJECT.name)
        .replace(/{{PROJECT_DESC}}/g, PROJECT.desc)
        .replace(/{{WALLET_ADDRESS}}/g, state.walletAddress || 'YOUR_SOLANA_WALLET_ADDRESS');

      return files;
    } catch (err) {
      console.log(`OpenRouter generation failed: ${err.message}. Falling back to local templates.`);
    }
  }

  return loadTemplates();
}

function createGitHubRepo(repoName, description) {
  const body = JSON.stringify({
    name: repoName,
    description: description,
    private: false,
    auto_init: false
  });
  const cmd = `curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d '${body}' https://api.github.com/user/repos`;
  const resp = JSON.parse(execSync(cmd).toString());
  if (resp.error) throw new Error(`GitHub error: ${resp.error}`);
  return resp;
}

function pushToGitHub(repoName, files) {
  const tempDir = fs.mkdtempSync(path.join(WORKSPACE, 'tmp-'));
  try {
    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = path.join(tempDir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
    });

    // 🛡️ SECURITY RAILCARD: Scan files before commit
    console.log('🛡️  Running security railcard scan...');
    const railcardPath = path.join(WORKSPACE, 'tools', 'security_railcard.js');
    try {
      const scanCmd = `node "${railcardPath}" "${tempDir}"`;
      const scanResult = execSync(scanCmd, { encoding: 'utf8' });
      console.log(scanResult);
    } catch (err) {
      const output = err.message || err;
      if (typeof output === 'string' && output.includes('No secrets')) {
        console.log('Security scan passed.');
      } else {
        console.log('SECURITY SCAN FAILED: ' + (output.substring(0, 200)));
        throw new Error('Security railcard blocked push due to potential secrets. Aborting.');
      }
    }

    execSync(`git init`, { cwd: tempDir });
    execSync(`git config user.email "agent@dance-agentic-engineer"`, { cwd: tempDir });
    execSync(`git config user.name "Colosseum Krump Agent"`, { cwd: tempDir });
    execSync(`git add -A`, { cwd: tempDir });
    execSync(`git commit -m "Initial commit: ${repoName}"`, { cwd: tempDir });
    const remoteUrl = `https://arunnadarasa:${GITHUB_TOKEN}@github.com/arunnadarasa/${repoName}.git`;
    execSync(`git remote add origin ${remoteUrl}`, { cwd: tempDir });
    execSync(`git push -u origin main`, { cwd: tempDir });
  } finally {
    execSync(`rm -rf ${tempDir}`);
  }
}

async function updateColosseumProject(state) {
  const body = JSON.stringify({
    name: PROJECT.name,
    description: PROJECT.desc,
    repoLink: state.repoUrl,
    solanaIntegration: 'Metaplex NFT minting for move certificates, x402 payment gateway for verification fees, treasury PDA for royalties, Helius webhooks for indexing',
    problemStatement: 'Krump dance creators lack reliable attribution and compensation when their signature moves are used by others. Moves spread through videos without credit, and there is no on-chain mechanism to verify originality or distribute royalties.',
    technicalApproach: 'We deploy an Anchor program on Solana devnet that (1) mints an NFT representing a dance move with metadata (creator, video hash, move name); (2) Requires x402 micropayment to mark the move as "verified" (preventing spam); (3) Automatically distributes a percentage of subsequent licensing fees to the creator via a treasury PDA. Helius webhooks index move usage events for off-chain analytics.',
    targetAudience: 'A Krump dancer who has created a signature move and wants to prove authorship and earn passive income when others use it. Also battle organizers who need to verify originality before competitions.',
    businessModel: 'Mint fee: $0.10 (covers NFT storage). Verification fee: $0.01 x402 payment per authenticity check. Royalty: 5% of any future licensing transaction. Free tier: 1 mint per week; Pro: unlimited mints and on-chain governance participation.',
    competitiveLandscape: 'OpenSea and general NFT platforms do not provide verification gating or automated royalties for move usage. POAPs are non-transferable souvenirs but cannot be licensed. No system focuses specifically on dance move attribution with micropayment verification.',
    futureVision: 'V2 adds a DAO governed by move creators to set standards and fee parameters. V3 integrates with KrumpClaw to auto-register battle-winning moves. V4 implements a marketplace where moves can be licensed directly via on-chain offers. We intend to raise a seed round and build full-time, targeting the global dance community.',
    tags: PROJECT.tags
  });
  const cmd = `curl -s -X PUT -H "Authorization: Bearer ${COLOSSEUM_API_KEY}" -H "Content-Type: application/json" -d '${body}' ${COLOSSEUM_API}/my-project`;
  const respStr = execSync(cmd).toString();
  const resp = JSON.parse(respStr);
  if (resp.error) throw new Error(`Update project failed: ${resp.error}`);
  return resp;
}

async function submitProject(state) {
  const cmd = `curl -s -X POST -H "Authorization: Bearer ${COLOSSEUM_API_KEY}" -H "Content-Type: application/json" ${COLOSSEUM_API}/my-project/submit`;
  const respStr = execSync(cmd).toString();
  const resp = JSON.parse(respStr);
  if (resp.error) throw new Error(`Submit failed: ${resp.error}`);
  return resp;
}

// Main state machine
(async () => {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  if (state.lastRunDate === today) {
    console.log('Already ran today; exiting.');
    return;
  }

  try {
    // Stage 1: Register agent (public endpoint)
    if (state.stage === 'register') {
      log(state, 'Registering agent with Colosseum...');
      const cmd = `curl -s -X POST https://agents.colosseum.com/api/agents -H "Content-Type: application/json" -d '{"name": "LovaDanceMoveRegistry"}'`;
      const respStr = execSync(cmd).toString();
      const resp = JSON.parse(respStr);
      if (resp.error) throw new Error(`Registration failed: ${resp.error}`);
      state.agentId = resp.agent.id;
      state.apiKey = resp.apiKey;
      state.claimCode = resp.claimCode;
      COLOSSEUM_API_KEY = resp.apiKey;
      log(state, `Registered agent ID ${state.agentId}. Claim code: ${state.claimCode}. Next: setup wallet.`);
      state.stage = 'wallet';
      saveState(state);
    }

    // Stage 2: Wallet setup (use existing or prompt)
    if (state.stage === 'wallet') {
      if (!state.walletAddress) {
        state.walletAddress = process.env.SOLANA_WALLET_ADDRESS || '';
        if (!state.walletAddress) {
          log(state, 'SOLANA_WALLET_ADDRESS not set in .env. Using placeholder. Set it for real submission.');
          state.walletAddress = 'YOUR_SOLANA_WALLET_ADDRESS';
        }
      }
      state.repoName = `moveregistry-solana-${Date.now()}`;
      log(state, `Wallet address: ${state.walletAddress}. Ready to build.`);
      state.stage = 'build';
      saveState(state);
    }

    // Stage 3: Build — generate code and push to GitHub
    if (state.stage === 'build') {
      if (!state.repoUrl) {
        log(state, 'Generating MoveRegistry code via OpenRouter (qwen-coder)...');
        const files = await generateMoveRegistryFiles(state);
        log(state, `Generated ${Object.keys(files).length} files`);

        log(state, 'Creating GitHub repository...');
        const repoInfo = createGitHubRepo(state.repoName, `MoveRegistry: ${PROJECT.desc}`);
        state.repoUrl = repoInfo.html_url;

        log(state, 'Pushing code to GitHub...');
        pushToGitHub(state.repoName, files);

        state.liveAppLink = 'https://moveregistry.vercel.app (deploy after hackathon)';
        state.presentationLink = 'https://youtube.com/watch?v=... (to be recorded)';
        log(state, 'Build and GitHub push complete. Repo: ' + state.repoUrl);
      }
      state.stage = 'draft';
      log(state, 'Creating Colosseum draft project...');
      saveState(state);
    }

    // Stage 4: Create draft project on Colosseum (requires existing repo)
    if (state.stage === 'draft') {
      if (state.projectId) {
        log(state, `Project ${state.projectId} already exists. Skipping draft creation.`);
      } else {
        // Use /projects endpoint to create project draft
        const body = JSON.stringify({
          agentId: state.agentId,
          projectName: PROJECT.name,
          repoUrl: state.repoUrl,
          // minimal required fields; will update later with full details
        });
        const cmd = `curl -s -X POST -H "Authorization: Bearer ${COLOSSEUM_API_KEY}" -H "Content-Type: application/json" -d '${body}' ${COLOSSEUM_API}/projects`;
        const respStr = execSync(cmd).toString();
        const resp = JSON.parse(respStr);
        if (resp.error) throw new Error(`Create draft failed: ${resp.error}`);
        state.projectId = resp.projectId;
        log(state, `Draft created (project ID: ${state.projectId}). Finalizing fields.`);
      }
      state.stage = 'finalize';
      saveState(state);
    }

    // Stage 5: Finalize project details
    if (state.stage === 'finalize') {
      log(state, 'Updating Colosseum project with required fields and links...');
      await updateColosseumProject(state);
      log(state, 'Project fields finalized.');
      state.stage = 'submit';
      saveState(state);
    }

    // Stage 6: Submit (requires human claim first)
    if (state.stage === 'submit') {
      log(state, 'Checking claim status before submission...');
      // We attempt submit; if claim not done, API returns error and we wait
      try {
        const result = await submitProject(state);
        log(state, `Submit successful! Colosseum project submitted.`);
        state.stage = 'done';
      } catch (err) {
        if (err.message.includes('claim')) {
          log(state, `Submit blocked: human claim not yet completed. Claim code: ${state.claimCode}. Will retry next run.`);
          // Do not advance stage; keep as submit
        } else {
          throw err;
        }
      }
      saveState(state);
    }

    if (state.stage === 'done') {
      log(state, 'All done. No further action needed.');
    }

  } catch (err) {
    log(state, `ERROR: ${err.message}`);
    console.error(err);
  } finally {
    state.lastRunDate = today;
    saveState(state);
  }
})();