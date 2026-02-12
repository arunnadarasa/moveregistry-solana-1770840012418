#!/usr/bin/env node
// Test Moltbook post

const fs = require('fs');
const path = require('path');

const ENV_PATH = '/Users/openclaw/.openclaw/workspace/krump-agent/.env';

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

async function testPost() {
  const fetch = globalThis.fetch;
  const res = await fetch('https://www.moltbook.com/api/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MOLTBOOK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      submolt: 'krump',
      title: '✅ LovaDance Test Post',
      content: `Testing Moltbook connection from OpenClaw.\n\nTime: ${new Date().toISOString()}\nStatus: All systems go 🕺\n\n#Krump #Test`
    })
  });

  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));

  if (!res.ok) {
    console.error('❌ Post failed');
    process.exit(1);
  } else {
    console.log('✅ Post successful!');
    console.log('Post URL:', `https://moltbook.com/p/${data.post?.id || data.content_id}`);
  }
}

testPost().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
