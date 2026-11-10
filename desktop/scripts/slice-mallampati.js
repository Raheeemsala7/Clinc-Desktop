const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'ui', 'public', 'images', 'mallampati.svg');
let svg = fs.readFileSync(svgPath, 'utf8');

// Ensure original has viewBox
if (!svg.includes('viewBox=')) {
  svg = svg.replace('<svg', '<svg viewBox="0 0 420.22345 577.30219"');
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log('Added viewBox to original mallampati.svg');
}

// Generate the 4 cropped SVGs
const quadrants = [
  { id: 1, name: 'mallampati-1.svg', viewBox: '0 0 210 288' },
  { id: 2, name: 'mallampati-2.svg', viewBox: '210 0 210 288' },
  { id: 3, name: 'mallampati-3.svg', viewBox: '0 288 210 289' },
  { id: 4, name: 'mallampati-4.svg', viewBox: '210 288 210 289' },
];

quadrants.forEach(q => {
  let qSvg = svg.replace(/viewBox="[^"]+"/, `viewBox="${q.viewBox}"`);
  qSvg = qSvg.replace(/width="[^"]+"/, 'width="100%"');
  qSvg = qSvg.replace(/height="[^"]+"/, 'height="100%"');
  const outPath = path.join(__dirname, '..', 'ui', 'public', 'images', q.name);
  fs.writeFileSync(outPath, qSvg, 'utf8');
  console.log(`Created ${q.name}`);
});
