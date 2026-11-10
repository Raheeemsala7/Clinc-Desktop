const fs = require('fs');

function getDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // for JPEG
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  // for PNG
  if (filePath.endsWith('.png')) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  return null;
}

['desktop/ui/public/images/ear-right.jpg', 'desktop/ui/public/images/ear-left.jpg', 'desktop/ui/public/images/larynx.png'].forEach(f => {
  console.log(f, getDimensions(f));
});
