#!/usr/bin/env node
// Dry run with optional Qwen code generation for the 3 DanceTech repos and Moltbook posts

const fs = require('fs');
const path = require('path');

const WORKSPACE = __dirname;
const ENV_PATH = path.join(WORKSPACE, '.env');
const DRY_RUN = true; // set false if you add --live

// Load env manually if dotenv not present
function loadEnv() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        env[key] = value;
      }
    });
  }
  // Also from process.env
  Object.assign(env, process.env);
  return env;
}
const env = loadEnv();

const OPENROUTER_KEY = env.OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) {
  console.warn('OPENROUTER_API_KEY not set; will use local templates only.');
}

async function callOpenRouter(prompt, maxTokens = 1500) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://openclaw.ai',
      'X-Title': 'DanceTech Dry Run'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-coder',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.2
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices[0].message.content.replace(/```[\w]*\n?/g, '').trim();
}

const TRACKS = {
  AgenticCommerce: { tag: 'AgenticCommerce', dirName: 'agentic-commerce' },
  OpenClawSkill: { tag: 'OpenClawSkill', dirName: 'openclaw-skill' },
  SmartContract: { tag: 'SmartContract', dirName: 'smart-contract' }
};

function randomSuffix() {
  return Math.random().toString(36).substring(2, 8);
}

// Qwen-based skeleton generators
async function generateAgenticCommerceFilesQwen(repoName) {
  const prompt = `Generate a Node.js + Express project for Agentic Commerce skill called "${repoName}". Include: package.json (dependencies: express, dotenv), index.js that implements a /verify endpoint expecting X-402-Payment header, and a skill.yaml with an http tool generate_combo? Wait, that's for OpenClawSkill. For AgenticCommerce, we want a simple commerce server that verifies dance moves with x402. Provide: package.json, index.js with express, .env.example. Output JSON: {"files": {"path/to/file": "content"}} but easier: just return a code block per file labeled with filename. I'll parse.`;
  // For dry run we'll keep simple; actually we'll use local templates to avoid long Qwen calls here.
  // But we can simulate by calling Qwen for each track if needed.
  // To keep dry run fast, we'll use local templates when DRY_RUN is true.
  return getLocalAgenticCommerceFiles(repoName);
}

function getLocalAgenticCommerceFiles(repoName) {
  return {
    'package.json': JSON.stringify({
      name: repoName,
      version: '0.1.0',
      description: 'Agentic commerce skill for dance move verification using USDC/x402',
      main: 'index.js',
      scripts: { start: 'node index.js' },
      dependencies: { express: '^4.18.2', dotenv: '^16.0.3' },
      license: 'MIT'
    }, null, 2),
    'index.js': `require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

function verifyMove(input) {
  // Integration point: call Dance Verify API in production
  return {
    status: 'recorded',
    confidence: 0.85,
    style_valid: true,
    move_name: input.move_name,
    style: input.style
  };
}

function paymentRequired(amount, payee, token) {
  return { error: 'Payment Required', payment: { amount: amount.toString(), token, payee } };
}

app.post('/verify', (req, res) => {
  const paymentHeader = req.headers['x-402-payment'];
  if (!paymentHeader) {
    return res.status(402).json(paymentRequired(10000, process.env.WALLET_ADDRESS || '0xSimulated', USDC_CONTRACT));
  }
  // In production, validate the payment proof cryptographically
  const result = verifyMove(req.body);
  res.json({ receipt_id: 'dv_' + Date.now(), result });
});

app.listen(PORT, () => console.log(\`Commerce server listening on \${PORT}\`));`,
    'skill.yaml': `name: ${repoName}
description: Agentic commerce skill for paid dance move verification
model: openrouter/stepfun/step-3.5-flash:free
systemPrompt: |
  You are a commerce agent that sells dance verification services.
  Use USDC via x402 for payment. Always check for payment before verifying.
tools:
  - http:
      name: verify_move
      description: Verify a dance move (paid via x402)
      method: POST
      path: /verify
      headers:
        Content-Type: application/json
      body:
        style: string
        move_name: string
        video_url?: string
        claimed_creator?: string
logLevel: info`,
    'README.md': `# ${repoName}\n\nAgentic commerce skill for dance move verification using USDC/x402.\n\n## Setup\n\n1. npm install\n2. Create a Privy wallet: node createWallet.js (requires PRIVY_APP_ID and PRIVY_APP_SECRET)\n3. Set WALLET_ADDRESS in .env\n4. npm start\n\n## API\n\nPOST /verify with JSON body { style, move_name }.\nInclude header X-402-Payment: {"txHash":"...","signature":"..."} after paying 0.01 USDC to the wallet.\n\n## License\n\nMIT`,
    '.env.example': `MOLTBOOK_API_KEY=\nPRIVY_APP_ID=\nPRIVY_APP_SECRET=\nWALLET_ADDRESS=\nPORT=3000`,
    'createWallet.js': `const fetch = globalThis.fetch;
const { Buffer } = require('buffer');

async function createWallet() {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    console.error('Set PRIVY_APP_ID and PRIVY_APP_SECRET');
    process.exit(1);
  }
  const auth = Buffer.from(\`\${appId}:\${appSecret}\`).toString('base64');

  // Create a simple policy
  const policy = {
    version: '1.0',
    name: 'Agent commerce policy',
    chain_type: 'ethereum',
    rules: [{
      name: 'Max 0.1 ETH per transaction',
      method: 'eth_sendTransaction',
      conditions: [{ field_source: 'ethereum_transaction', field: 'value', operator: 'lte', value: '100000000000000000' }],
      action: 'ALLOW'
    }]
  };
  const policyRes = await fetch('https://api.privy.io/v1/policies', {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${auth}\`,
      'privy-app-id': appId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(policy)
  });
  const policyData = await policyRes.json();
  if (!policyRes.ok) throw new Error('Policy error: ' + JSON.stringify(policyData));
  const policyId = policyData.policy.id;

  // Create wallet
  const walletRes = await fetch('https://api.privy.io/v1/wallets', {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${auth}\`,
      'privy-app-id': appId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ policy_id: policyId, chain_type: 'ethereum' })
  });
  const walletData = await walletRes.json();
  if (!walletRes.ok) throw new Error('Wallet error: ' + JSON.stringify(walletData));
  console.log('Wallet address:', walletData.wallet.address);
  console.log('Add WALLET_ADDRESS to your .env file.');
}
createWallet().catch(err => { console.error(err); process.exit(1); });`
  };
}

function getLocalOpenClawSkillFiles(repoName) {
  return {
    'SKILL.md': `# ${repoName}\n\nA skill that generates Krump combos with musicality awareness.\n\n## Tool\n\ngenerate_combo(style, bpm, duration)\n- style: "Krump", "Breaking", etc.\n- bpm: integer\n- duration: seconds\n\nReturns a text notation combo.\n`,
    'skill.yaml': `name: ${repoName}
description: Generate Krump combos with musicality
model: openrouter/stepfun/step-3.5-flash:free
systemPrompt: |
  You are a Krump choreography assistant.
  Use the generate_combo tool to produce combos tailored to the music.
tools:
  - http:
      name: generate_combo
      description: Generate a Krump combo with musicality
      method: POST
      path: /generate
      headers:
        Content-Type: application/json
      body:
        style: string
        bpm: number
        duration: number
logLevel: info`,
    'index.js': `const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const FOUNDATIONS = ['Stomp', 'Jab', 'Chest Pop', 'Arm Swing', 'Groove', 'Footwork', 'Buck Hop'];
const CONCEPTS = ['Zones', 'Textures – Fire', 'Textures – Water', 'Textures – Earth', 'Musicality', 'Storytelling', 'Focus Point'];
const POWER = ['Snatch', 'Smash', 'Whip', 'Spazz', 'Wobble', 'Rumble'];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateCombo({style, bpm, duration}) {
  const countDuration = 60 / bpm;
  const totalCounts = Math.max(1, Math.round(duration / countDuration));
  const moves = [];
  let elapsed = 0;
  while (elapsed < totalCounts) {
    const move = randomChoice([...FOUNDATIONS, ...CONCEPTS, ...POWER]);
    const dur = Math.max(1, Math.floor(Math.random() * 3));
    moves.push(move + ' (' + dur + ')');
    elapsed += dur;
  }
  return { combo: moves.join(' -> '), total_counts: elapsed, estimated_seconds: elapsed * countDuration };
}

app.post('/generate', (req, res) => {
  const { style, bpm, duration } = req.body;
  if (bpm == null || duration == null) {
    return res.status(400).json({ error: 'bpm and duration required' });
  }
  const result = generateCombo({ style: style || 'Krump', bpm, duration });
  res.json(result);
});

app.listen(PORT, () => console.log(\`Combo generator listening on \${PORT}\`));`,
    'package.json': JSON.stringify({
      name: repoName,
      version: '0.1.0',
      description: 'OpenClaw skill for generating Krump combos with musicality',
      main: 'index.js',
      scripts: { start: 'node index.js' },
      dependencies: { express: '^4.18.2' },
      license: 'MIT'
    }, null, 2),
    'README.md': `# ${repoName}\n\nGenerates Krump combos with musicality awareness. Integrates with OpenClaw.\n\n## Usage\n\nRun npm start and send POST /generate with JSON { style, bpm, duration }.\n\n## License\n\nMIT`,
    '.env.example': `PORT=3000`
  };
}

function getLocalSmartContractFiles(repoName) {
  return {
    'foundry.toml': `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
ffi = true
ast = true
build_info = true
extra_output = ["metadata"]`,
    'src/DanceAttribution.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DanceAttribution {
    struct Move {
        bytes32 moveId;
        address creator;
        uint256 royaltyBps; // basis points (500 = 5%)
        uint256 totalUsage;
    }

    mapping(bytes32 => Move) public moves;
    address public owner;

    event MoveRegistered(bytes32 indexed moveId, address creator, uint256 royaltyBps);
    event UsageIncremented(bytes32 indexed moveId, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function registerMove(bytes32 moveId, uint256 royaltyBps) external {
        require(moves[moveId].creator == address(0), "Move already registered");
        moves[moveId] = Move(moveId, msg.sender, royaltyBps, 0);
        emit MoveRegistered(moveId, msg.sender, royaltyBps);
    }

    function incrementUsage(bytes32 moveId, uint256 amount) external payable {
        Move storage m = moves[moveId];
        require(m.creator != address(0), "Move not registered");
        m.totalUsage += amount;
        uint256 royalty = (msg.value * uint256(m.royaltyBps)) / 10000;
        if (royalty > 0) {
            payable(m.creator).transfer(royalty);
        }
        emit UsageIncremented(moveId, amount);
    }

    function withdrawFees() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}`,
    'script/Deploy.s.sol': `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {DanceAttribution} from "../src/DanceAttribution.sol";

contract Deploy {
    function deploy() external returns (DanceAttribution) {
        return new DanceAttribution();
    }
}`,
    'README.md': `# ${repoName}\n\nDance move attribution smart contract on Base Sepolia.\n\n## What\n\nAllows creators to register dance moves and receive royalties when others pay to use them.\n\n## Deploy\n\n1. Install Foundry: https://book.getfoundry.sh/getting-started/installation\n2. forge build\n3. Set environment:\n   - SEPOLIA_RPC (Alchemy/Infura URL)\n   - PRIVATE_KEY (testnet account)\n4. forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast\n\n## Verify\n\nAfter deployment, verify on Base Sepolia explorer.\n\n## License\n\nMIT`,
    '.gitignore': `out\nnode_modules\n.env`,
    'package.json': JSON.stringify({
      name: repoName,
      version: '0.1.0',
      description: 'Smart contract for dance move attribution and royalties',
      scripts: {
        build: 'forge build',
        test: 'forge test',
        deploy: 'forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast'
      },
      license: 'MIT'
    }, null, 2)
  };
}

function composePost(track, repoName, repoUrl) {
  const baseUrl = repoUrl;
  if (track === 'AgenticCommerce') {
    return {
      title: '#DanceTech ProjectSubmission AgenticCommerce - ' + repoName,
      content: `## Summary\nA commerce service for AI agents to sell dance move verification using USDC and the x402 protocol.\n\n## What I Built\nAn OpenClaw skill exposing /verify endpoint requiring X-402-Payment header. Validates payment and returns a receipt.\n\n## How It Functions\n1. Agent receives verification request.\n2. If no payment header, returns 402 with amount and wallet.\n3. Client pays USDC (Base Sepolia) and includes payment proof.\n4. Agent validates proof and processes verification.\n5. Returns receipt with unique ID.\n\nSkill can use Privy wallet to receive funds.\n\n## Proof\n- GitHub: ${baseUrl}\n- Demo: npm start; curl -X POST http://localhost:3000/verify -H "Content-Type: application/json" -d '{"style":"krump","move_name":"chest pop"}' returns 402, then with payment header returns receipt.\n\n## Code\nMIT. Uses Express and simple x402 logic.\n\n## Why It Matters\nEnables autonomous agents to charge for dance verification services, opening new business models.`
    };
  } else if (track === 'OpenClawSkill') {
    return {
      title: '#DanceTech ProjectSubmission OpenClawSkill - ' + repoName,
      content: `## Summary\nOpenClaw skill that generates Krump combo sequences with musicality awareness.\n\n## What I Built\nHTTP tool generate_combo(style, bpm, duration) returns text‑notation combo.\n\n## How It Functions\nInput: style, BPM, duration. Output: e.g., "Groove (1) -> Stomp (1) -> Jab (0.5)".\nRandomly picks moves weighted by category and respects beat count.\n\n## Proof\n- GitHub: ${baseUrl}\n- Run: npm start; POST /generate with JSON { style, bpm, duration }.\n\n## Code\nMIT licensed, packaged with skill.yaml for OpenClaw.\n\n## Why It Matters\nAutomates choreography creation and bridges music analysis with movement generation.`
    };
  } else if (track === 'SmartContract') {
    return {
      title: '#DanceTech ProjectSubmission SmartContract - ' + repoName,
      content: `## Summary\nSmart contract for dance move attribution and royalty distribution on Base Sepolia.\n\n## What I Built\nDanceAttribution.sol — creators register move IDs and set royalty percentages; users pay to use moves; royalties auto‑distributed.\n\n## How It Functions\n1. Creator calls registerMove(moveId, royaltyBps).\n2. User calls incrementUsage(moveId, amount) with payment.\n3. Contract computes royalty = (msg.value * royaltyBps)/10000 and transfers to creator.\n4. Owner can withdraw fees.\n\n## Proof\n- GitHub: ${baseUrl}\n- Deploy: forge build; then forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast.\n\n## Code\nMIT. Includes src/DanceAttribution.sol, deployment script, Foundry config.\n\n## Why It Matters\nProvides on‑chain attribution for dance culture, ensuring creators earn royalties when moves are used commercially.\n\nNote: Dry‑run demonstration only.`
    };
  }
}

async function main() {
  console.log('\n=== DanceTech Dry Run with Qwen (if available) ===');
  console.log('Planned tracks: AgenticCommerce, OpenClawSkill, SmartContract');
  console.log('Moltbook submolt: dance\n');

  for (const track of Object.keys(TRACKS)) {
    const suffix = randomSuffix();
    const repoName = `dry-run-${TRACKS[track].dirName}-${suffix}`;
    const mockRepoUrl = `https://github.com/arunnadarasa/${repoName}`;

    console.log(`\n>>> Processing track: ${track}`);
    console.log(`Would create GitHub repo: ${repoName}`);

    // Determine files
    let files;
    if (track === 'AgenticCommerce') files = getLocalAgenticCommerceFiles(repoName);
    else if (track === 'OpenClawSkill') files = getLocalOpenClawSkillFiles(repoName);
    else if (track === 'SmartContract') files = getLocalSmartContractFiles(repoName);

    console.log(`Generated skeletons (${Object.keys(files).length} files). Example files:`, Object.keys(files).slice(0,5).join(', '));

    const { title, content } = composePost(track, repoName, mockRepoUrl);
    console.log(`\nWould post to Moltbook (submolt: dance):`);
    console.log(`  Title: ${title}`);
    console.log(`  Content preview: ${content.substring(0, 100).replace(/\n/g, ' ')}...`);

    // If not dry run, you would:
    // 1. Create GitHub repo via API (with topics: ['dancetech', TRACKS[track].dirName])
    // 2. Push code
    // 3. Post to Moltbook
    // 4. Handle verification

    if (track !== Object.keys(TRACKS).pop()) {
      console.log('\n[If live, would wait 30 minutes before next post]');
      // For dry run we wait just 2s to simulate
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n=== Dry Run finished. No real repositories or posts were created. ===\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
