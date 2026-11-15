const fs = require('fs');
const path = require('path');

const uiDir = path.resolve(__dirname, '../desktop/ui');
const standaloneDir = path.join(uiDir, '.next', 'standalone');
const nestedUiDir = path.join(standaloneDir, 'desktop', 'ui');

console.log('📦 [FRONTEND] Preparing Next.js standalone static and public files...');

const staticSrc = path.join(uiDir, '.next', 'static');
const publicSrc = path.join(uiDir, 'public');

function safeCp(src, dest) {
  try {
    fs.cpSync(src, dest, { recursive: true, force: true, errorOnExist: false });
  } catch (e) {
    console.warn(`ℹ️ [SafeCp] Note: ${e.message}`);
  }
}

// Copy .next/static to nested and root
if (fs.existsSync(staticSrc)) {
  const target1 = path.join(nestedUiDir, '.next', 'static');
  const target2 = path.join(standaloneDir, '.next', 'static');
  safeCp(staticSrc, target1);
  safeCp(staticSrc, target2);
  console.log('✅ Copied .next/static to standalone');
}

// Copy public to nested and root
if (fs.existsSync(publicSrc)) {
  const target1 = path.join(nestedUiDir, 'public');
  const target2 = path.join(standaloneDir, 'public');
  safeCp(publicSrc, target1);
  safeCp(publicSrc, target2);
  console.log('✅ Copied public to standalone');
}

// Copy .env to nested and root
const envSrc = path.join(uiDir, '.env');
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, path.join(nestedUiDir, '.env'));
  fs.copyFileSync(envSrc, path.join(standaloneDir, '.env'));
  console.log('✅ Copied .env to standalone');
}

// Convert all symlinks / junctions into real portable directories
try {
  require('./un-symlink-frontend');
} catch (e) {
  console.warn('⚠️ Warning running un-symlink-frontend:', e.message);
}

console.log('🎉 [FRONTEND] Standalone Next.js assets ready.');

