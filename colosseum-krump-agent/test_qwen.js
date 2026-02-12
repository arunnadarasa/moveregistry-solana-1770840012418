const fs = require('fs');
const path = require('path');

// Load .env from workspace root
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) {
  console.error('OPENROUTER_API_KEY not set in .env');
  process.exit(1);
}

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
    messages: [{ role: 'user', content: 'Hello, Qwen! Write a Rust function that returns 42.' }],
    max_tokens: 100
  })
})
  .then(res => res.text().then(txt => ({ status: res.status, statusText: res.statusText, body: txt })))
  .then(d => {
    console.log(JSON.stringify(d, null, 2));
    if (d.status === 200) {
      try {
        const data = JSON.parse(d.body);
        console.log('Answer:', data.choices?.[0]?.message?.content || 'no content');
      } catch (e) {}
    }
  })
  .catch(err => console.error('Fetch error:', err.message));
