const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const PRIVY_APP_ID = env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = env.PRIVY_APP_SECRET;
if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.error('Missing PRIVY_APP_ID or PRIVY_APP_SECRET in .env');
  process.exit(1);
}

const auth = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64');

async function createPolicy() {
  const policy = {
    version: "1.0",
    name: "Krump Agent Solana Wallet Policy",
    chain_type: "solana",
    rules: [
      {
        name: "Allow all Solana operations",
        method: "*",
        conditions: [],
        action: "ALLOW"
      }
    ]
  };
  const res = await fetch('https://api.privy.io/v1/policies', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'privy-app-id': PRIVY_APP_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(policy)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Policy creation failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function createWallet(policyId) {
  const wallet = {
    chain_type: "solana",
    policy_ids: [policyId]
  };
  const res = await fetch('https://api.privy.io/v1/wallets', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'privy-app-id': PRIVY_APP_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(wallet)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Wallet creation failed: ${res.status} ${err}`);
  }
  return res.json();
}

createPolicy()
  .then(policy => {
    console.log('Policy created:', policy.id);
    return createWallet(policy.id);
  })
  .then(wallet => {
    console.log('Wallet created:', wallet.id, 'Address:', wallet.address);
    // Update .env
    let content = fs.readFileSync(envPath, 'utf8');
    const line = `SOLANA_WALLET_ADDRESS=${wallet.address}`;
    if (/^SOLANA_WALLET_ADDRESS=/.test(content)) {
      content = content.replace(/^SOLANA_WALLET_ADDRESS=.*$/m, line);
    } else {
      content += `\n${line}`;
    }
    fs.writeFileSync(envPath, content);
    console.log('Updated .env with SOLANA_WALLET_ADDRESS');
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
