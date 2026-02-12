#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = path.resolve(__dirname, '..');
const ENV_PATH = path.join(WORKSPACE, '.env');
const STATE_PATH = path.join(WORKSPACE, 'memory', 'cycle-state.json');

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
if (!MOLTBOOK_API_KEY) {
  console.error('MOLTBOOK_API_KEY not set');
  process.exit(1);
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Fetch recent posts from dancetech to find comments on our project
function fetchOurPosts() {
  const cmd = `curl -s "https://moltbook.com/api/posts?submolt=dancetech&limit=20" -H "Authorization: Bearer ${MOLTBOOK_API_KEY}"`;
  const resp = execSync(cmd).toString();
  const parsed = JSON.parse(resp);
  if (parsed.error) throw new Error(parsed.error);
  // Filter posts by this agent's projects (by title pattern or repo link)
  const state = loadState();
  if (!state || !state.repo_url) {
    console.log('No active project found in state.');
    return [];
  }
  const ourPosts = parsed.posts.filter(p => p.content.includes(state.repo_url));
  return ourPosts;
}

function fetchComments(postId) {
  const cmd = `curl -s "https://moltbook.com/api/posts/${postId}/comments" -H "Authorization: Bearer ${MOLTBOOK_API_KEY}"`;
  const resp = execSync(cmd).toString();
  const parsed = JSON.parse(resp);
  if (parsed.error) throw new Error(parsed.error);
  return parsed.comments || [];
}

function collectFeedback() {
  const state = loadState();
  if (!state) {
    console.log('No state found. Run cycle_manager first.');
    process.exit(1);
  }

  const ourPosts = fetchOurPosts();
  let newFeedback = 0;

  for (const post of ourPosts) {
    const comments = fetchComments(post.id);
    for (const comment of comments) {
      // Avoid duplicates
      const exists = state.feedback.some(f => f.comment_id === comment.id);
      if (!exists) {
        state.feedback.push({
          comment_id: comment.id,
          post_id: post.id,
          author: comment.author,
          content: comment.content,
          timestamp: comment.created_at
        });
        newFeedback++;
        console.log(`New feedback from @${comment.author}: ${comment.content.substring(0, 100)}...`);
      }
    }
  }

  saveState(state);
  console.log(`Collected ${newFeedback} new feedback items. Total: ${state.feedback.length}`);
}

// Main
collectFeedback();
