const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const prompt = `Write a Solana Anchor program (v0.30) called "move_registry" with the following features:
- Mint NFT for a dance move: accounts include move_mint (mint), move_data (custom account storing move metadata: creator, video_hash, timestamp, move_name, royalty_percent, verified bool), treasury (pda) for fees
- Verify move: payer sends x402-style payment to treasury; mark move as verified in move_data
- Royalty distribution: when a move is used/licensed, transfer a percentage (royalty_percent) to creator's token account
Include necessary instructions, accounts structs, events. Use anchor_lang. Output only Rust code, no markdown.`;

console.time('call');
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://openclaw.ai',
    'X-Title': 'OpenClaw Test'
  },
  body: JSON.stringify({
    model: 'qwen/qwen3-coder',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.2
  })
})
  .then(res => res.text().then(txt => ({ status: res.status, body: txt })))
  .then(d => {
    console.timeEnd('call');
    console.log('Status:', d.status);
    if (d.status === 200) {
      try {
        const data = JSON.parse(d.body);
        const content = data.choices?.[0]?.message?.content || 'no content';
        console.log('First 200 chars:', content.slice(0, 200));
      } catch (e) { console.error(e); }
    } else {
      console.log('Body:', d.body.slice(0, 300));
    }
  })
  .catch(err => {
    console.timeEnd('call');
    console.error('Error:', err.message);
  });
