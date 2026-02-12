const fs = require('fs');
const path = require('path');

const skillRepo = '/tmp/dance-agentic-engineer-skill';
const srcPath = path.join(skillRepo, 'scripts', 'dancetech_post.js');
const original = fs.readFileSync(srcPath, 'utf8');
const lines = original.split('\n');

const idxA = lines.findIndex(l => l.includes('function generateAgenticCommerceFiles('));
const idxD = lines.findIndex(l => l.includes('function composePost('));

if (idxA === -1 || idxD === -1) {
  console.error('Could not locate function boundaries');
  process.exit(1);
}

const part1 = lines.slice(0, idxA).join('\n');
let part3 = lines.slice(idxD).join('\n');

// Add await before generator calls in part3
part3 = part3.replace(/files = generateAgenticCommerceFiles\(repoName\);/g, 'files = await generateAgenticCommerceFiles(repoName);');
part3 = part3.replace(/files = generateOpenClawSkillFiles\(repoName\);/g, 'files = await generateOpenClawSkillFiles(repoName);');
part3 = part3.replace(/files = generateSmartContractFiles\(repoName\);/g, 'files = await generateSmartContractFiles(repoName);');

const newGenerators = `
if (!env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY missing in .env');
  process.exit(1);
}

// OpenRouter call with retry
async function callOpenRouter(prompt, maxTokens = 2000) {
  const maxAttempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${env.OPENROUTER_API_KEY}\`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://openclaw.ai',
          'X-Title': 'DanceTech Code Gen'
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
        throw new Error(\`OpenRouter \${response.status}: \${err}\`);
      }
      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/^\\\`\\\`\\\`json\\s*|\\s*\\\`\\\`\\\`$/g, '').trim();
      return JSON.parse(content);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && (err.message.includes('429') || err.message.includes('rate limit'))) {
        await new Promise(r => setTimeout(r, 5000 * attempt));
        continue;
      }
      throw lastError;
    }
  }
}

async function generateAgenticCommerceFiles(repoName) {
  const prompt = \`Generate a complete Node.js + Express project named "\${repoName}" for an Agentic Commerce skill in the dance domain. The project must include these exact files:

- package.json: with name "\${repoName}", version "0.1.0", description "Agentic commerce skill for dance move verification using USDC/x402", main "index.js", scripts { "start": "node index.js" }, dependencies { "express": "^4.18.2", "dotenv": "^16.0.3" }, license "MIT".
- index.js: Express app with POST /verify endpoint. If X-402-Payment header missing, respond 402 with JSON { error: "Payment Required", payment: { amount: "10000", token: "USDC", payee: process.env.WALLET_ADDRESS || "0xSimulated" } }. If header present, mock validate and return { receipt_id: 'dv_' + Date.now(), result: { status: 'recorded', confidence: 0.85, style_valid: true, move_name: req.body.move_name, style: req.body.style } }.
- skill.yaml: defines OpenClaw skill with http tool "verify_move", description "Verify a dance move (paid via x402)", method POST, path /verify, headers including Content-Type: application/json, body schema: style (string), move_name (string), optional video_url, optional claimed_creator. systemPrompt: "You are a commerce agent that sells dance verification services. Use USDC via x402 for payment. Always check for payment before verifying."
- README.md: setup steps: npm install; node createWallet.js to create Privy wallet (requires PRIVY_APP_ID and PRIVY_APP_SECRET); set WALLET_ADDRESS in .env; npm start.
- .env.example: MOLTBOOK_API_KEY=, PRIVY_APP_ID=, PRIVY_APP_SECRET=, WALLET_ADDRESS=, PORT=3000.
- createWallet.js: uses Privy API (https://api.privy.io/v1) to create a wallet with a policy allowing eth_sendTransaction up to 0.1 ETH. Uses Basic auth with PRIVY_APP_ID and PRIVY_APP_SECRET. On success, prints wallet address to console.

Return a JSON object where keys are file paths (e.g., "package.json", "index.js", "skill.yaml", "README.md", ".env.example", "createWallet.js") and values are the complete file contents as strings. No extra text, only the JSON.\`;
  return await callOpenRouter(prompt);
}

async function generateOpenClawSkillFiles(repoName) {
  const prompt = \`Generate a complete Node.js + Express project named "\${repoName}" for an OpenClaw skill that generates Krump dance combos with musicality. Files:

- package.json: name "\${repoName}", version "0.1.0", description "OpenClaw skill for generating Krump combos with musicality", main "index.js", scripts { "start": "node index.js" }, dependencies { "express": "^4.18.2" }, license "MIT".
- index.js: Express app on PORT env or 3000. Define arrays: FOUNDATIONS = ["Stomp","Jab","Chest Pop","Arm Swing","Groove","Footwork","Buck Hop"]; CONCEPTS = ["Zones","Textures – Fire","Textures – Water","Textures – Earth","Musicality","Storytelling","Focus Point"]; POWER = ["Snatch","Smash","Whip","Spazz","Wobble","Rumble"]; implement generateCombo({style, bpm, duration}) that calculates countDuration = 60/bpm, totalCounts = Math.round(duration / countDuration). Build sequence: while elapsed < totalCounts, pick random move from combined list, assign duration 1 or 2 counts, accumulate. Return JSON: { combo: moves.join(' -> '), total_counts: elapsed, estimated_seconds: elapsed * countDuration }.
- skill.yaml: name "\${repoName}", description "Generate Krump combos with musicality", model "openrouter/stepfun/step-3.5-flash:free", systemPrompt: "You are a Krump choreography assistant. Use the generate_combo tool to produce combos tailored to the music.", tools: - http: name "generate_combo", description "Generate a Krump combo with musicality", method POST, path "/generate", body: { style: string, bpm: number, duration: number }.
- README.md: usage instructions (npm start, POST /generate).
- .env.example: PORT=3000.

Return JSON mapping file paths to contents.\`;
  return await callOpenRouter(prompt);
}

async function generateSmartContractFiles(repoName) {
  const prompt = \`Generate a Foundry project for a dance move attribution smart contract on Base Sepolia. Files:

- foundry.toml: [profile.default] src = "src", out = "out", libs = ["lib"], ffi = true, ast = true, build_info = true, extra_output = ["metadata"].
- src/DanceAttribution.sol: SPDX-License-Identifier: MIT, pragma solidity ^0.8.20; contract DanceAttribution { struct Move { bytes32 moveId; address creator; uint256 royaltyBps; uint256 totalUsage; } mapping(bytes32 => Move) public moves; address public owner; event MoveRegistered(bytes32 indexed moveId, address creator, uint256 royaltyBps); event UsageIncremented(bytes32 indexed moveId, uint256 amount); constructor() { owner = msg.sender; } function registerMove(bytes32 moveId, uint256 royaltyBps) external { require(moves[moveId].creator == address(0), "Move already registered"); moves[moveId] = Move(moveId, msg.sender, royaltyBps, 0); emit MoveRegistered(moveId, msg.sender, royaltyBps); } function incrementUsage(bytes32 moveId, uint256 amount) external payable { Move storage m = moves[moveId]; require(m.creator != address(0), "Move not registered"); m.totalUsage += amount; uint256 royalty = (msg.value * uint256(m.royaltyBps)) / 10000; if (royalty > 0) { payable(m.creator).transfer(royalty); } emit UsageIncremented(moveId, amount); } function withdrawFees() external { require(msg.sender == owner, "Not owner"); payable(owner).transfer(address(this).balance); } }
- script/Deploy.s.sol: SPDX-License-Identifier: UNLICENSED, pragma solidity ^0.8.20; import {DanceAttribution} from "../src/DanceAttribution.sol"; contract Deploy { function deploy() external returns (DanceAttribution) { return new DanceAttribution(); } }
- README.md: description, deployment steps: 1) Install Foundry, 2) forge build, 3) set SEPOLIA_RPC and PRIVATE_KEY, 4) forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast. Also mention verification.
- .gitignore: out, node_modules, .env
- package.json: name "\${repoName}", version "0.1.0", description "Smart contract for dance move attribution and royalties", scripts { build: "forge build", test: "forge test", deploy: "forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast" }, license "MIT".

Return JSON mapping file paths to contents.\`;
  return await callOpenRouter(prompt);
}
`;

const newContent = part1 + newGenerators + '\n' + part3;

fs.writeFileSync(srcPath, newContent);
console.log('Updated dancetech_post.js with Qwen generation');