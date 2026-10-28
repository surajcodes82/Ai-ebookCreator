/**
 * Minimal image dimension reader (PNG / JPEG / GIF / BMP / WEBP).
 * Used to place cover images in the generated PDF without extra dependencies.
 */
const readUInt32BE = (buf, offset) => buf.readUInt32BE(offset);
const readUInt32LE = (buf, offset) => buf.readUInt32LE(offset);

const jpegSize = (buf) => {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
};

const imageSize = (buffer) => {
  if (!buffer || buffer.length < 24) return null;
  try {
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { width: readUInt32BE(buffer, 16), height: readUInt32BE(buffer, 20), format: 'png' };
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      const size = jpegSize(buffer);
      return size ? { ...size, format: 'jpg' } : null;
    }
    // GIF
    if (buffer.toString('ascii', 0, 3) === 'GIF') {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8), format: 'gif' };
    }
    // BMP
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return { width: readUInt32LE(buffer, 18), height: Math.abs(readInt32LE(buffer, 22)), format: 'bmp' };
    }
    // WEBP (VP8X)
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buffer.toString('ascii', 12, 16);
      if (chunk === 'VP8X') {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return { width, height, format: 'webp' };
      }
      if (chunk === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, format: 'webp' };
      }
      if (chunk === 'VP8 ') {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff, format: 'webp' };
      }
    }
  } catch (err) {
    return null;
  }
  return null;
};

function readInt32LE(buf, offset) {
  return buf.readInt32LE(offset);
}

module.exports = { imageSize };
