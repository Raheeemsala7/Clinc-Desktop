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
  const serverJsSrc = path.join(standaloneDir, 'desktop', 'ui', 'server.js');
  if (fs.existsSync(serverJsSrc)) {
    fs.mkdirSync(path.join(frontendDest, 'desktop', 'ui'), { recursive: true });
    fs.copyFileSync(serverJsSrc, path.join(frontendDest, 'desktop', 'ui', 'server.js'));
    fs.copyFileSync(serverJsSrc, path.join(frontendDest, 'server.js'));
  }

  // Copy .next
  const dotNextSrc = path.join(standaloneDir, 'desktop', 'ui', '.next');
  const dotNextDest = path.join(frontendDest, 'desktop', 'ui', '.next');
  if (fs.existsSync(dotNextSrc)) {
    fs.cpSync(dotNextSrc, dotNextDest, { recursive: true, force: true });
    fs.cpSync(dotNextSrc, path.join(frontendDest, '.next'), { recursive: true, force: true });
  }

  // Copy public
  const publicSrc = path.join(root, 'desktop', 'ui', 'public');
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, path.join(frontendDest, 'desktop', 'ui', 'public'), { recursive: true, force: true });
    fs.cpSync(publicSrc, path.join(frontendDest, 'public'), { recursive: true, force: true });
  }

  console.log('✅ Copied updated Next.js frontend to win-unpacked/resources/frontend');
}

console.log('🎉 Fast sync completed successfully!');
