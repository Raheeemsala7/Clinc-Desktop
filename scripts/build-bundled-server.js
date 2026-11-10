const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const outDir = path.join(rootDir, 'desktop', 'resources', 'server');

console.log('🚀 [BUNDLE] Building Standalone Express API Server...');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Run esbuild to bundle server into a single file
console.log('📦 [BUNDLE] Running esbuild on server/src/server.ts...');
const esbuildExe = path.join(serverDir, 'node_modules', '.pnpm', '@esbuild+win32-x64@0.27.0', 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');
const esbuildCmd = `"${esbuildExe}" src/server.ts --bundle --platform=node --target=node20 --outfile="${path.join(outDir, 'server.js')}" --external:argon2`;
execSync(esbuildCmd, { cwd: serverDir, stdio: 'inherit' });

// 2. Prepare standalone argon2 and @phc/format inside outDir/node_modules
console.log('🔑 [BUNDLE] Checking standalone argon2 native addon...');
const targetNodeModules = path.join(outDir, 'node_modules');
const targetArgon = path.join(targetNodeModules, 'argon2');
const targetPhc = path.join(targetNodeModules, '@phc', 'format');
const argonBinary = path.join(targetArgon, 'lib', 'binding', 'napi-v3', 'argon2.node');

if (!fs.existsSync(argonBinary)) {
  if (fs.existsSync(targetArgon)) {
    try { fs.rmSync(targetArgon, { recursive: true, force: true }); } catch {}
  }
  fs.mkdirSync(targetArgon, { recursive: true });

  // Copy argon2 files
  const argonSource = path.join(serverDir, 'node_modules', 'argon2');
  fs.cpSync(argonSource, targetArgon, { recursive: true, dereference: true });

  // Patch argon2.js to directly point to the napi-v3 binary without @mapbox/node-pre-gyp
  const argonJsPath = path.join(targetArgon, 'argon2.js');
  let argonJs = fs.readFileSync(argonJsPath, 'utf8');
  argonJs = argonJs.replace(
    'const binary = require("@mapbox/node-pre-gyp");\n\nconst bindingPath = binary.find(path.resolve(__dirname, "./package.json"));',
    'const bindingPath = path.resolve(__dirname, "./lib/binding/napi-v3/argon2.node");'
  );
  fs.writeFileSync(argonJsPath, argonJs, 'utf8');
}

if (!fs.existsSync(targetPhc)) {
  fs.mkdirSync(targetPhc, { recursive: true });
  const phcSource = path.join(serverDir, 'node_modules', '.pnpm', '@phc+format@1.0.0', 'node_modules', '@phc', 'format');
  fs.cpSync(phcSource, targetPhc, { recursive: true, dereference: true });
}

// 3. Write production .env for the packaged server
const envContent = `PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/clinic-management
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
LOCAL_STORAGE_PATH=D:/ClinicData/uploads
STORAGE_DRIVER=local
`;
fs.writeFileSync(path.join(outDir, '.env'), envContent, 'utf8');

console.log('✅ [BUNDLE] Standalone Server successfully created at:', outDir);
