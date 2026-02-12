#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = path.resolve(__dirname, '..');
const ENV_PATH = path.join(WORKSPACE, '.env');
const STATE_PATH = path.join(WORKSPACE, 'memory', 'cycle-state.json');
const LOG_PATH = path.join(WORKSPACE, 'memory', 'cycle-log.json');

function loadEnv() {
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  });
  return env;
}
const env = loadEnv();
const MOLTBOOK_API_KEY = env.MOLTBOOK_API_KEY;
const GITHUB_TOKEN = env.GITHUB_PUBLIC_TOKEN;
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;

if (!MOLTBOOK_API_KEY || !GITHUB_TOKEN || !OPENROUTER_API_KEY) {
  console.error('Missing required environment variables: MOLTBOOK_API_KEY, GITHUB_PUBLIC_TOKEN, OPENROUTER_API_KEY');
  process.exit(1);
}

// OpenRouter call using global fetch (Node 18+) with retry for rate limits
async function callOpenRouter(prompt, temperature = 0.3) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-coder:free',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: 4096
        })
      });
      if (!response.ok) {
        const err = await response.text();
        if (response.status === 429 && attempt < maxRetries) {
          const waitMs = 10000 * attempt; // 10s, 20s, 30s
          console.log(`Rate limited (429). Retrying in ${waitMs}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
        throw new Error(`OpenRouter error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (err.message.includes('429') && attempt < maxRetries) {
        const waitMs = 10000 * attempt;
        console.log(`Rate limited (429) in catch. Retrying in ${waitMs}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw err;
    }
  }
}

// Post to Moltbook
function postToMoltbook(title, content) {
  const payload = {
    subdomain: 'dancetech',
    title,
    content,
    verification_required: false
  };
  const cmd = `curl -s -X POST https://moltbook.com/api/posts/create \\\n    -H 'Authorization: Bearer ${MOLTBOOK_API_KEY}' \\\n    -H 'Content-Type: application/json' \\\n    -d '${JSON.stringify(payload)}'`;
  const response = execSync(cmd).toString();
  const parsed = JSON.parse(response);
  if (parsed.error) throw new Error(`Moltbook error: ${parsed.error}`);
  return parsed;
}

// GitHub repo handling
function createGitHubRepo(name, description) {
  const payload = {
    name,
    description,
    private: false,
    has_issues: true,
    has_projects: false,
    has_wiki: false
  };
  const cmd = `curl -s -X POST https://api.github.com/user/repos \\\n    -H "Authorization: Bearer ${GITHUB_TOKEN}" \\\n    -H "Content-Type: application/json" \\\n    -d '${JSON.stringify(payload)}'`;
  const response = execSync(cmd).toString();
  const parsed = JSON.parse(response);
  if (parsed.error) throw new Error(`GitHub error: ${parsed.error}`);
  return { html_url: parsed.html_url, ssh_url: parsed.ssh_url };
}

function pushToGitHub(repoName, files) {
  const tempDir = path.join(WORKSPACE, 'tmp', `build-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
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
  execSync(`git config user.name "DanceTech Agent"`, { cwd: tempDir });
  execSync(`git add -A`, { cwd: tempDir });
  execSync(`git commit -m "Initial commit: ${repoName}"`, { cwd: tempDir });
  const remoteUrl = `https://arunnadarasa:${GITHUB_TOKEN}@github.com/arunnadarasa/${repoName}.git`;
  execSync(`git remote add origin ${remoteUrl}`, { cwd: tempDir });
  execSync(`git push -u origin main`, { cwd: tempDir });
  execSync(`rm -rf ${tempDir}`);
}

function log(message) {
  let log = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      const content = fs.readFileSync(LOG_PATH, 'utf8').trim();
      if (content) log = JSON.parse(content);
    } catch (e) {
      log = []; // reset if corrupt
    }
  }
  log.push({
    timestamp: new Date().toISOString(),
    message
  });
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  console.log(message);
}

// State management
function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { lastRunDate: null, trackState: {}, feedback: [] };
  try {
    const content = fs.readFileSync(STATE_PATH, 'utf8').trim();
    return content ? JSON.parse(content) : { lastRunDate: null, trackState: {}, feedback: [] };
  } catch (e) {
    return { lastRunDate: null, trackState: {}, feedback: [] };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Track definitions – creative idea lists
const TRACKS = {
  AgenticCommerce: {
    ideas: [
      { title: 'KrumpVerifier', desc: 'on-chain move verification with x402' },
      { title: 'DancePayroll', desc: 'automated instructor payments via Privy' },
      { title: 'BattlePurse', desc: 'tournament prize pools with USDC locks' },
      { title: 'StudioSub', desc: 'subscription management for dance studios' },
      { title: 'TipJarEmbeddable', desc: 'embedded tipping for dance videos' },
      { title: 'CredentialMinter', desc: 'verifiable dance certificates as NFTs' },
      { title: 'Tipple', desc: 'micro-payments for workshops and classes' },
      { title: 'RoyaltySplit', desc: 'automatic royalty distribution for choreography' }
    ]
  },
  OpenClawSkill: {
    ideas: [
      { title: 'KrumpMeter', desc: 'real-time move intensity analyzer via video' },
      { title: 'BattleJudge', desc: 'automated Krump battle scoring with LLM judges' },
      { title: 'MoveDNA', desc: 'unique fingerprinting of Krump styles' },
      { title: 'CrewSync', desc: 'collaborative choreography builder for crews' },
      { title: 'LegacyPass', desc: 'encrypted knowledge transfer from OG to next-gen' },
      { title: 'EnergyFlow', desc: 'live energy meter for sessions' },
      { title: 'StyleProfiler', desc: 'classify Krump style (Raw, Rugged, Gully, etc.)' },
      { title: 'HypeTracker', desc: 'community engagement metrics for posts' }
    ]
  },
  SmartContract: {
    ideas: [
      { title: 'MoveRegistry', desc: 'on-chain registry of verified Krump moves with creator attribution' },
      { title: 'BattleEscrow', desc: 'escrow for tournament prizes, released on results' },
      { title: 'StyleNFT', desc: 'generative NFTs representing unique Krump styles' },
      { title: 'RepToken', desc: 'reputation token for contributors to Krump ecosystem' },
      { title: 'WorkshopTicket', desc: 'NFT tickets to paid workshops, nontransferable' },
      { title: 'VerificationOracle', desc: 'Chainlink oracle for move verification' },
      { title: 'ChestPopToken', desc: 'ERC20 awarded for consistent lab participation' },
      { title: 'LegacyBeacon', desc: 'event emitter for historic Krump moments' }
    ]
  }
};

// Helper: generate package.json content
function generatePackageJson(name, description, dependencies = {}) {
  return JSON.stringify({
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    description,
    main: 'index.js',
    scripts: { start: 'node index.js' },
    dependencies
  }, null, 2);
}

// File generation – mixes LLM and templates

async function generateFiles(track, idea) {
  const safeName = idea.title.toLowerCase().replace(/\s+/g, '-');
  const files = {};

  if (track === 'AgenticCommerce') {
    // Use LLM for index.js
    const indexPrompt = `Write an Express.js server for an Agentic Commerce project named "${idea.title}". It should accomplish: ${idea.desc}. Include USDC payment verification via x402 in a POST /verify endpoint. Use process.env.PORT and USDC_CONTRACT. Add CORS and JSON body parsing. Provide only raw JavaScript code, no markdown.`;
    files['index.js'] = await callOpenRouter(indexPrompt, 0.2);

    // Package.json template
    files['package.json'] = generatePackageJson(safeName, idea.desc, {
      express: '^4.18.2',
      cors: '^2.8.5',
      dotenv: '^16.0.3',
      jsonwebtoken: '^9.0.0',
      web3: '^4.2.0'
    });

    // README.md – use LLM to draft
    const readmePrompt = `Write a professional README.md for a Node.js project called "${idea.title}". It is an Agentic Commerce system for ${idea.desc}. Include sections: Problem, Solution, Architecture, Usage, Onchain Details. Use proper Markdown.`;
    files['README.md'] = await callOpenRouter(readmePrompt, 0.4);

    // .env.example
    files['.env.example'] = `PORT=3000\nUSDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e\nPRIVY_APP_ID=\nAPP_NAME=${idea.title}\n`;

  } else if (track === 'OpenClawSkill') {
    // LLM for skill.yaml
    const yamlPrompt = `Generate a valid YAML for an OpenClaw skill named "${idea.title}" with description: "${idea.desc}". Include systemPrompt describing the agent's role related to this skill. Model: openrouter/stepfun/step-3.5-flash:free. Tools: optional http if needed. Output only YAML, no backticks.`;
    files['skill.yaml'] = await callOpenRouter(yamlPrompt, 0.3);

    // README.md via LLM
    const readmePrompt = `Write a README.md for an OpenClaw skill called "${idea.title}" that ${idea.desc}. Include Installation, Capabilities, Examples. Use Markdown.`;
    files['README.md'] = await callOpenRouter(readmePrompt, 0.4);

    // index.js placeholder
    files['index.js'] = `console.log('${idea.title} loaded');\n`;

  } else if (track === 'SmartContract') {
    // LLM for Solidity contract
    const contractName = idea.title.replace(/\s+/g, '');
    const solPrompt = `Write a Solidity smart contract named ${contractName}. Purpose: ${idea.desc}. Use Solidity ^0.8.19, SPDX license MIT. Include an event and a basic function. Add NatSpec comments. Output only the .sol file content.`;
    const solContent = await callOpenRouter(solPrompt, 0.2);
    files[`contracts/${contractName}.sol`] = solContent;

    // Hardhat config (template)
    files['hardhat.config.js'] = `require('@nomicfoundation/hardhat-toolbox');\n\nmodule.exports = {\n  solidity: '0.8.19',\n  networks: {\n    hardhat: {},\n    sepolia: {\n      url: process.env.SEPOLIA_RPC || '',\n      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []\n    }\n  }\n};`;

    // Package.json for SC
    files['package.json'] = JSON.stringify({
      name: safeName,
      version: '1.0.0',
      scripts: {
        compile: 'hardhat compile',
        test: 'hardhat test',
        deploy: 'hardhat run scripts/deploy.js --network sepolia'
      },
      devDependencies: {
        'hardhat': '^2.17.0',
        '@nomicfoundation/hardhat-toolbox': '^5.0.0',
        '@openzeppelin/contracts': '^5.0.0'
      }
    }, null, 2);

    // Deploy script template with dynamic contract name
    files['scripts/deploy.js'] = `const hre = require('hardhat');\n\nasync function main() {\n  const ${contractName} = await hre.ethers.deployContract('${contractName}');\n  await ${contractName}.waitForDeployment();\n  console.log('${idea.title} deployed to:', await ${contractName}.getAddress());\n}\n\nmain().catch((error) => {\n  console.error(error);\n  process.exitCode = 1;\n});`;

    // README via LLM
    const readmePrompt = `Write a README.md for a Solidity smart contract project called "${idea.title}". It ${idea.desc}. Include Purpose, Deployment, Verification sections in Markdown.`;
    files['README.md'] = await callOpenRouter(readmePrompt, 0.4);

    // .env.example for SC
    files['.env.example'] = `SEPOLIA_RPC=https://sepolia.infura.io/v3/...\nPRIVATE_KEY=0x...\n`;
  }

  return files;
}

// Main execution
(async () => {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  if (state.lastRunDate === today) {
    log('Already ran today; exiting.');
    return;
  }

  // Ensure trackState exists
  state.trackState = state.trackState || {};
  const tracks = ['AgenticCommerce', 'OpenClawSkill', 'SmartContract'];

  for (const track of tracks) {
    try {
      // Rotate idea index
      const trackData = TRACKS[track];
      state.trackState[track] = state.trackState[track] || { lastIndex: -1 };
      const nextIndex = (state.trackState[track].lastIndex + 1) % trackData.ideas.length;
      const idea = trackData.ideas[nextIndex];
      state.trackState[track].lastIndex = nextIndex;

      log(`[${track}] Generating project: ${idea.title} — ${idea.desc}`);
      const files = await generateFiles(track, idea);

      const safeName = idea.title.toLowerCase().replace(/\s+/g, '-');
      const timestamp = Date.now().toString(36).substring(2, 8);
      const repoName = `${safeName}-${timestamp}`;
      const repoInfo = createGitHubRepo(repoName, `${track} project: ${idea.desc}`);
      log(`[${track}] GitHub repo created: ${repoInfo.html_url}`);

      pushToGitHub(repoName, files);
      log(`[${track}] Pushed code to GitHub.`);

      // Compose post
      const title = `[DanceTech] ${track}: ${idea.title}`;
      let content = `## 🎯 ${idea.title}\n\n${idea.desc}\n\n`;
      content += `**GitHub:** ${repoInfo.html_url}\n\n`;
      content += `Built with qwen-coder agent. Feedback and contributions welcome!\n\n`;
      content += `#DanceTech #${track.replace(/\s+/g,'')}`;
      const post = postToMoltbook(title, content);
      log(`[${track}] Posted to Moltbook: ${post.id || post.content_id}`);

    } catch (err) {
      log(`ERROR processing ${track}: ${err.message}`);
      // Continue to next track
    }
  }

  state.lastRunDate = today;
  saveState(state);
  log('Cycle complete.');
})();
