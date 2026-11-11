const fs = require('fs');
const path = require('path');

function deJunctionDir(baseDir) {
  const nmDir = path.join(baseDir, 'node_modules');
  if (!fs.existsSync(nmDir)) return;

  console.log(`🔧 [DE-JUNCTION] Processing: ${nmDir}`);

  // List of top-level items in node_modules
  const items = fs.readdirSync(nmDir);

  for (const item of items) {
    if (item === '.pnpm') continue;
    const itemPath = path.join(nmDir, item);
    try {
      const stat = fs.lstatSync(itemPath);
      if (stat.isSymbolicLink()) {
        const target = fs.realpathSync(itemPath);
        console.log(`📦 Converting junction to real folder: ${item} -> ${target}`);
        fs.unlinkSync(itemPath);
        fs.cpSync(target, itemPath, { recursive: true, dereference: true });
        console.log(`✅ Converted ${item} to standalone real folder.`);
      }
    } catch (err) {
      console.error(`⚠️ Error processing ${item}:`, err.message);
    }
  }

  // Also hoist packages from .pnpm/node_modules into base node_modules
  const pnpmNmDir = path.join(nmDir, '.pnpm', 'node_modules');
  if (fs.existsSync(pnpmNmDir)) {
    console.log(`🚀 Hoisting packages from .pnpm/node_modules to root node_modules...`);
    const pnpmItems = fs.readdirSync(pnpmNmDir);
    for (const pItem of pnpmItems) {
      const pItemPath = path.join(pnpmNmDir, pItem);
      const targetDest = path.join(nmDir, pItem);
      try {
        if (pItem.startsWith('@')) {
          // Scoped packages like @next, @swc, @img
          if (!fs.existsSync(targetDest)) {
            fs.mkdirSync(targetDest, { recursive: true });
          }
          const subItems = fs.readdirSync(pItemPath);
          for (const sub of subItems) {
            const subSource = path.join(pItemPath, sub);
            const subDest = path.join(targetDest, sub);
            if (!fs.existsSync(subDest)) {
              const realSub = fs.realpathSync(subSource);
              fs.cpSync(realSub, subDest, { recursive: true, dereference: true });
              console.log(`✅ Hoisted @${pItem}/${sub}`);
            }
          }
        } else {
          if (!fs.existsSync(targetDest)) {
            const real = fs.realpathSync(pItemPath);
            fs.cpSync(real, targetDest, { recursive: true, dereference: true });
            console.log(`✅ Hoisted ${pItem}`);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Warning hoisting ${pItem}:`, err.message);
      }
    }
  }
}

// 1. Process desktop/dist-installer/win-unpacked/resources/frontend
const winUnpackedFrontend = path.resolve(__dirname, '../desktop/dist-installer/win-unpacked/resources/frontend/desktop/ui');
if (fs.existsSync(winUnpackedFrontend)) {
  deJunctionDir(winUnpackedFrontend);
}

// 2. Process standalone frontend in desktop/ui/.next/standalone/desktop/ui
const standaloneFrontend = path.resolve(__dirname, '../desktop/ui/.next/standalone/desktop/ui');
if (fs.existsSync(standaloneFrontend)) {
  deJunctionDir(standaloneFrontend);
}

console.log('🎉 [DE-JUNCTION] All junctions successfully replaced with portable real directories!');

