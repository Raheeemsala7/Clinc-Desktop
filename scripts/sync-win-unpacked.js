const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const winUnpacked = path.join(root, 'desktop', 'dist-installer', 'win-unpacked', 'resources');

if (!fs.existsSync(winUnpacked)) {
  console.log('win-unpacked not found, skipping sync');
  process.exit(0);
}

// 1. Sync server.js
const serverSrc = path.join(root, 'desktop', 'resources', 'server', 'server.js');
const serverDest = path.join(winUnpacked, 'server', 'server.js');
if (fs.existsSync(serverSrc)) {
  fs.copyFileSync(serverSrc, serverDest);
  console.log('✅ Copied server.js to win-unpacked/resources/server');
}

// 2. Sync Next.js standalone files to win-unpacked/resources/frontend
const frontendDest = path.join(winUnpacked, 'frontend');
const standaloneDir = path.join(root, 'desktop', 'ui', '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  fs.mkdirSync(frontendDest, { recursive: true });
  try {
    fs.cpSync(standaloneDir, frontendDest, { recursive: true, force: true, errorOnExist: false });
  } catch (err) {
    console.log('ℹ️ Frontend standalone already in sync or locked by system.');
  }

  const serverJsSrc = path.join(standaloneDir, 'desktop', 'ui', 'server.js');
  if (fs.existsSync(serverJsSrc)) {
    try {
      fs.copyFileSync(serverJsSrc, path.join(frontendDest, 'server.js'));
    } catch {}
  }

  // Copy public
  const publicSrc = path.join(root, 'desktop', 'ui', 'public');
  if (fs.existsSync(publicSrc)) {
    try {
      fs.cpSync(publicSrc, path.join(frontendDest, 'desktop', 'ui', 'public'), { recursive: true, force: true });
      fs.cpSync(publicSrc, path.join(frontendDest, 'public'), { recursive: true, force: true });
    } catch {}
  }

  console.log('✅ Next.js standalone frontend is ready in win-unpacked/resources/frontend');
}

console.log('🎉 Fast sync completed successfully!');
