const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const realSrc = fs.realpathSync(path.join(rootDir, 'server', 'node_modules', 'argon2'));
const dest1 = path.join(rootDir, 'desktop', 'resources', 'server', 'node_modules', 'argon2');
const dest2 = path.join(rootDir, 'desktop', 'dist-installer', 'win-unpacked', 'resources', 'server', 'node_modules', 'argon2');

function copyAndPatch(dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  // Copy files one by one or recursively
  fs.cpSync(realSrc, dest, { recursive: true, force: true, dereference: true });
  const argonJsPath = path.join(dest, 'argon2.js');
  if (fs.existsSync(argonJsPath)) {
    let content = fs.readFileSync(argonJsPath, 'utf8');
    const oldStr = 'const binary = require("@mapbox/node-pre-gyp");\n\nconst bindingPath = binary.find(path.resolve(__dirname, "./package.json"));';
    const newStr = 'const bindingPath = path.resolve(__dirname, "./lib/binding/napi-v3/argon2.node");';
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      fs.writeFileSync(argonJsPath, content, 'utf8');
    }
  }
}

copyAndPatch(dest1);
copyAndPatch(dest2);
console.log('✅ Argon2 copied and patched successfully in all locations!');
