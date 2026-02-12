#!/usr/bin/env node
const fs = require('fs');
const file = process.argv[2];
let content = fs.readFileSync(file, 'utf8');
const insertBlock = `
    // 🛡️ SECURITY RAILCARD: Scan files before commit
    console.log('🛡️  Running security railcard scan...');
    const railcardPath = path.join(WORKSPACE, 'scripts', 'tools', 'security_railcard.js');
    try {
      const scanCmd = \`node "\${railcardPath}" "\${repoDir}"\`;
      const scanResult = execSync(scanCmd, { encoding: 'utf8' });
      console.log(scanResult);
      if (scanResult.includes('SECURITY ALERT') || scanResult.includes('❌')) {
        throw new Error('Security railcard blocked push due to potential secrets.');
      }
    } catch (err) {
      if (err.message && err.message.includes('No secrets')) {
        console.log('Security scan passed.');
      } else {
        console.error('SECURITY SCAN FAILED:', err.message);
        throw new Error('Security railcard blocked push. Aborting.');
      }
    }
`;
const marker = '    });\n    execSync(';
if (content.includes(marker)) {
  content = content.replace(marker, '    });\n' + insertBlock + '\n    execSync(');
  fs.writeFileSync(file, content);
  console.log('✅ Updated dancetech_post.js with security railcard');
} else {
  console.error('❌ Marker not found');
  process.exit(1);
}
