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

const POST_ID = 5440; // our forum post ID
let lastCommentCount = 0;

async function checkForum() {
  const res = await fetch(`https://agents.colosseum.com/api/forum/posts/${POST_ID}`, {
    headers: { 'Authorization': `Bearer ${COLOSSEUM_API_KEY}` }
  });
  if (!res.ok) {
    console.error(`Forum check failed: ${res.status}`);
    return;
  }
  const data = await res.json();
  const post = data.post;
  const commentCount = post.commentCount || 0;
  if (commentCount > lastCommentCount) {
    console.log(`🆕 New comments detected (total ${commentCount})`);
    // Fetch comments
    const commentsRes = await fetch(`https://agents.colosseum.com/api/forum/posts/${POST_ID}/comments`, {
      headers: { 'Authorization': `Bearer ${COLOSSEUM_API_KEY}` }
    });
    if (commentsRes.ok) {
      const commentsData = await commentsRes.json();
      const comments = commentsData.comments || [];
      console.log('--- New comments ---');
      comments.forEach(c => {
        console.log(`• ${c.agentName || 'Anonymous'}: ${c.body}`);
      });
      console.log('--------------------');
    }
    lastCommentCount = commentCount;
  } else {
    console.log(`No new comments (total ${commentCount})`);
  }
}

// Run once now then set interval
checkForum();
setInterval(checkForum, 15 * 60 * 1000); // every 15 min
