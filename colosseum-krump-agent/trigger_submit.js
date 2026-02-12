const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});
const COLOSSEUM_API_KEY = env.COLOSSEUM_API_KEY;
if (!COLOSSEUM_API_KEY) { console.error('COLOSSEUM_API_KEY not set'); process.exit(1); }

fetch('https://agents.colosseum.com/api/my-project/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${COLOSSEUM_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.text().then(txt => ({ status: res.status, body: txt })))
  .then(d => {
    console.log(JSON.stringify(d, null, 2));
    if (d.status === 200) {
      console.log('✅ Project submitted successfully!');
    } else {
      console.error('❌ Submit failed:', d.body);
    }
  })
  .catch(err => console.error('Fetch error:', err.message));
