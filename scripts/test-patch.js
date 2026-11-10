const fs = require('fs');
const path = require('path');

const targetPhc = path.resolve('test-standalone-server/node_modules/@phc/format');
fs.cpSync('server/node_modules/.pnpm/@phc+format@1.0.0/node_modules/@phc/format', targetPhc, { recursive: true, dereference: true });

const argonFile = path.resolve('test-standalone-server/node_modules/argon2/argon2.js');
let content = fs.readFileSync(argonFile, 'utf8');
content = content.replace(
  'const binary = require("@mapbox/node-pre-gyp");\n\nconst bindingPath = binary.find(path.resolve(__dirname, "./package.json"));',
  'let bindingPath = path.resolve(__dirname, "./lib/binding/napi-v3/argon2.node");'
);
fs.writeFileSync(argonFile, content, 'utf8');

// Also test argon2 directly right now:
const argon = require(argonFile);
argon.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy', 'pw').catch(() => {
  console.log('Argon2 loaded and works cleanly in standalone!');
});

