const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { markdownToBlocks } = require('../utils/markdown');
const { imageSize } = require('../utils/imageSize');
const { UPLOAD_DIR } = require('../middleware/upload');

const PAGE_MARGIN = 64;
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2;

const COLORS = {
  primary: '#7c3aed',
  text: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  quote: '#7c3aed',
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
  mono: 'Courier',
  monoBold: 'Courier-Bold',
};

const fontFor = (segment) => {
  if (segment.code) return segment.bold ? FONTS.monoBold : FONTS.mono;
  if (segment.bold && segment.italic) return FONTS.boldItalic;
  if (segment.bold) return FONTS.bold;
  if (segment.italic) return FONTS.italic;
  return FONTS.regular;
};

const resolveImageBuffer = async (src) => {
  if (!src) return null;
  try {
    if (src.startsWith('/uploads/')) {
      const filePath = path.join(UPLOAD_DIR, path.basename(src));
      return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
    }
    if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)) {
      return Buffer.from(src.replace(/^data:image\/[a-z+]+;base64,/, ''), 'base64');
    }
    if (/^https?:\/\//i.test(src)) {
      const response = await axios.get(src, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxContentLength: 12 * 1024 * 1024,
      });
      return Buffer.from(response.data);
    }
  } catch (err) {
    console.error('Could not load image for PDF:', err.message);
  }
  return null;
};

/** Inline Markdown -> styled text segments. */
const parseInline = (text, styles = {}) => {
  const segments = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|~~([^~]+)~~|`([^`]+)`/g;

  let cursor = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index), ...styles });
    if (match[1] !== undefined) {
      segments.push({ text: match[1] ? `[${match[1]}]` : '[image]', ...styles, italic: true });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], ...styles, link: match[4] });
      if (match[4] && match[3] !== match[4]) {
        segments.push({ text: ` (${match[4]})`, ...styles, italic: true });
      }
    } else if (match[5] !== undefined) segments.push({ text: match[5], ...styles, bold: true, italic: true });
    else if (match[6] !== undefined) segments.push({ text: match[6], ...styles, bold: true });
    else if (match[7] !== undefined) segments.push({ text: match[7], ...styles, bold: true });
    else if (match[8] !== undefined) segments.push({ text: match[8], ...styles, italic: true });
    else if (match[9] !== undefined) segments.push({ text: match[9], ...styles, italic: true });
    else if (match[10] !== undefined) segments.push({ text: match[10], ...styles, strike: true });
    else if (match[11] !== undefined) segments.push({ text: match[11], ...styles, code: true });
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), ...styles });
  return segments.filter((segment) => segment.text !== undefined && segment.text !== '');
};

const visibleText = (segments) => segments.map((segment) => segment.text).join('');

const measureSegments = (doc, segments, width, size) => {
  const savedFont = doc._fontFace;
  const savedSize = doc._fontSize;
  doc.font(FONTS.regular).fontSize(size);
  const height = doc.heightOfString(visibleText(segments) || ' ', { width, lineGap: 1 });
  if (savedFont) doc.font(savedFont);
  if (savedSize) doc.fontSize(savedSize);
  return height;
};

const drawSegments = (doc, segments, { x, width, align = 'left', size = 11 }) => {
  const usable = segments.filter((segment) => segment.text);
  if (!usable.length) return;
  doc.x = x;
  usable.forEach((segment, index) => {
    const isLast = index === usable.length - 1;
    doc
      .font(fontFor(segment))
      .fontSize(segment.code ? Math.max(size - 1.5, 7) : size)
      .fillColor(segment.code ? '#be123c' : COLORS.text)
      .text(segment.text, {
        continued: !isLast,
        width,
        align,
        lineGap: 1,
        underline: Boolean(segment.underline),
        strike: Boolean(segment.strike),
      });
  });
  doc.fillColor(COLORS.text);
};

const drawAt = (doc, x, y, draw) => {
  const prevX = doc.x;
  const prevY = doc.y;
  draw(x, y);
  doc.x = prevX;
  doc.y = prevY;
};

const ensureSpace = (doc, height) => {
  if (doc.y + height > doc.page.maxY()) {
    doc.addPage();
    doc.x = PAGE_MARGIN;
    doc.y = PAGE_MARGIN;
  }
};

const HEADING_SIZES = { 1: 26, 2: 22, 3: 17, 4: 14, 5: 12, 6: 11 };

const drawBlocks = async (doc, blocks) => {
  for (const block of blocks) {
    if (block.type === 'heading') {
      const size = HEADING_SIZES[block.level] || 11;
      const segments = parseInline(block.text, { bold: true });
      const height = Math.max(measureSegments(doc, segments, CONTENT_WIDTH, size), size) + size * 0.9;
      ensureSpace(doc, height + 20);
      doc.y += block.level <= 2 ? 10 : 6;
      drawSegments(doc, segments, { x: PAGE_MARGIN, width: CONTENT_WIDTH, align: block.align, size });
      doc.y += block.level <= 2 ? 12 : 8;
      continue;
    }

    if (block.type === 'hr') {
      ensureSpace(doc, 30);
      doc.y += 8;
      doc
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .moveTo(PAGE_MARGIN, doc.y)
        .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
        .stroke();
      doc.y += 18;
      continue;
    }

    if (block.type === 'image') {
      const buffer = await resolveImageBuffer(block.src);
      const dims = buffer ? imageSize(buffer) : null;
      let rendered = false;
      if (buffer && dims) {
        const maxWidth = Math.min(420, CONTENT_WIDTH);
        const scale = Math.min(1, maxWidth / dims.width);
        const width = Math.round(dims.width * scale);
        const height = Math.round(dims.height * scale);
        ensureSpace(doc, height + 24);
        doc.y += 6;
        try {
          drawAt(doc, PAGE_MARGIN, doc.y, (x, y) => {
            doc.image(buffer, x + (CONTENT_WIDTH - width) / 2, y, { width, height });
          });
          rendered = true;
        } catch (err) {
          console.error('Could not render an inline image in the PDF:', err.message);
        }

        if (rendered) {
          doc.y += height + 6;
          if (block.alt) {
            doc.font(FONTS.italic).fontSize(9).fillColor(COLORS.muted);
            doc.text(block.alt, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center' });
            doc.fillColor(COLORS.text);
          }
          doc.y += 14;
        }
      }
      if (!rendered && (block.alt || block.src)) {
        const segments = parseInline(`*Image: ${block.alt || block.src}*`, { italic: true });
        ensureSpace(doc, 24);
        drawSegments(doc, segments, { x: PAGE_MARGIN, width: CONTENT_WIDTH, align: 'center', size: 10 });
        doc.y += 10;
      }
      continue;
    }

    if (block.type === 'code') {
      doc.font(FONTS.mono).fontSize(9.5);
      const height = doc.heightOfString(block.text || ' ', { width: CONTENT_WIDTH - 8, lineGap: 2 });
      ensureSpace(doc, height + 26);
      doc.y += 6;
      const y0 = doc.y;
      doc.save();
      doc.roundedRect(PAGE_MARGIN - 8, y0 - 6, CONTENT_WIDTH + 16, height + 14, 4).fill('#f3f4f6');
      doc.restore();
      doc.font(FONTS.mono).fontSize(9.5).fillColor('#1f2937');
      doc.text(block.text, PAGE_MARGIN, y0, { width: CONTENT_WIDTH, lineGap: 2, align: 'left' });
      doc.fillColor(COLORS.text);
      doc.y = y0 + height + 12;
      continue;
    }

    if (block.type === 'quote') {
      const segments = parseInline(block.text, { italic: true });
      const width = CONTENT_WIDTH - 20;
      const height = measureSegments(doc, segments, width, 11);
      ensureSpace(doc, height + 22);
      doc.y += 6;
      const y0 = doc.y;
      doc.save();
      doc.rect(PAGE_MARGIN - 6, y0 - 4, 3, height + 8).fill(COLORS.quote);
      doc.restore();
      drawSegments(doc, segments, { x: PAGE_MARGIN + 12, width, align: block.align, size: 11 });
      doc.y = y0 + height + 10;
      continue;
    }

    if (block.type === 'list') {
      block.items.forEach((item, index) => {
        const marker = block.ordered ? `${index + 1}.` : '•';
        const segments = parseInline(item.text);
        const textX = PAGE_MARGIN + 22;
        const width = CONTENT_WIDTH - 22;
        const height = measureSegments(doc, segments, width, 11);
        ensureSpace(doc, height + 8);
        const y0 = doc.y;
        drawSegments(doc, segments, { x: textX, width, align: item.align, size: 11 });
        const endY = doc.y;
        drawAt(doc, PAGE_MARGIN, y0 + 1, (x, y) => {
          doc.font(FONTS.regular).fontSize(11).fillColor(COLORS.muted);
          doc.text(marker, x, y, { lineBreak: false });
        });
        doc.y = Math.max(endY, y0) + 3;
        doc.x = PAGE_MARGIN;
      });
      doc.y += 8;
      continue;
    }

    // paragraph
    const segments = parseInline(block.text);
    if (!segments.length) continue;
    const height = measureSegments(doc, segments, CONTENT_WIDTH, 11);
    ensureSpace(doc, height + 24);
    doc.y += 2;
    drawSegments(doc, segments, { x: PAGE_MARGIN, width: CONTENT_WIDTH, align: block.align, size: 11 });
    doc.y += 9;
  }
};

const drawCoverPage = async (doc, book) => {
  const cover = await resolveImageBuffer(book.coverImage);
  const dims = cover ? imageSize(cover) : null;

  if (cover && dims) {
    const maxWidth = 320;
    const maxHeight = 430;
    const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
    const width = dims.width * scale;
    const height = dims.height * scale;
    doc.save();
    doc.roundedRect((612 - width) / 2 + 4, 78 + 4, width, height, 6).fillOpacity(0.12).fill('#000000');
    doc.restore();
    try {
      doc.image(cover, (612 - width) / 2, 78, { width, height });
      doc.y = 78 + height + 46;
    } catch (err) {
      // A corrupt or unsupported image must never break the export.
      console.error('Could not render the cover image in the PDF:', err.message);
      doc.y = 250;
    }
  } else {
    doc.y = 250;
  }

  doc.x = PAGE_MARGIN;
  doc.font(FONTS.bold).fontSize(32).fillColor(COLORS.text);
  doc.text(book.title || 'Untitled eBook', PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
    lineGap: 4,
  });
  doc.y += 14;

  if (book.subtitle) {
    doc.font(FONTS.italic).fontSize(16).fillColor(COLORS.muted);
    doc.text(book.subtitle, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center', lineGap: 3 });
    doc.y += 20;
  }

  doc.font(FONTS.regular).fontSize(13).fillColor(COLORS.primary);
  doc.text(book.author ? `by ${book.author}` : '', PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  doc.y += 30;

  doc.strokeColor(COLORS.border).lineWidth(1);
  doc.moveTo(250, doc.y).lineTo(362, doc.y).stroke();
  doc.y += 18;

  doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.faint);
  doc.text('Generated with AI eBook Creator', PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  doc.addPage();
};

const drawTableOfContents = (doc, book) => {
  doc.font(FONTS.bold).fontSize(24).fillColor(COLORS.text);
  doc.text('Contents', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.y += 8;
  doc.strokeColor(COLORS.primary).lineWidth(2).moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + 60, doc.y).stroke();
  doc.y += 26;

  (book.chapters || []).forEach((chapter, index) => {
    ensureSpace(doc, 34);
    const y0 = doc.y;
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.primary);
    doc.text(`CHAPTER ${index + 1}`, PAGE_MARGIN, y0, { width: 90, lineBreak: false });
    doc.font(FONTS.regular).fontSize(12).fillColor(COLORS.text);
    doc.text(chapter.title, PAGE_MARGIN + 96, y0, { width: CONTENT_WIDTH - 96, lineBreak: false });
    doc.y = y0 + 22;
    doc.x = PAGE_MARGIN;
    doc.strokeColor(COLORS.border).lineWidth(0.5);
    doc.moveTo(PAGE_MARGIN, doc.y - 6).lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y - 6).stroke();
    doc.y += 4;
  });
  doc.addPage();
};

const drawChapter = async (doc, book, chapter, index) => {
  doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.primary);
  doc.text(`CHAPTER ${index + 1}`, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.y += 6;

  doc.font(FONTS.bold).fontSize(24).fillColor(COLORS.text);
  doc.text(chapter.title || `Chapter ${index + 1}`, PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    lineGap: 3,
  });
  doc.y += 10;
  doc.strokeColor(COLORS.primary).lineWidth(2);
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + 72, doc.y).stroke();
  doc.y += 20;

  if (!chapter.content || !chapter.content.trim()) {
    doc.font(FONTS.italic).fontSize(11).fillColor(COLORS.faint);
    doc.text('This chapter has no content yet.', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
    doc.y += 20;
  } else {
    const blocks = markdownToBlocks(chapter.content);
    const firstHeading = blocks[0]?.type === 'heading' ? blocks[0].text.trim().toLowerCase() : null;
    const skipFirstHeading = firstHeading && firstHeading === String(chapter.title || '').trim().toLowerCase();
    await drawBlocks(doc, skipFirstHeading ? blocks.slice(1) : blocks);
  }

  if (index < (book.chapters || []).length - 1) doc.addPage();
};

const addPageFooters = (doc, book) => {
  try {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      if (i === 0) continue; // cover page
      doc.switchToPage(i);
      const y = doc.page.height - 42;
      doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.faint);
      doc.text(`${book.title || 'Untitled'}  ·  Page ${i + 1}`, PAGE_MARGIN, y, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineBreak: false,
      });
    }
  } catch (err) {
    console.error('Could not add PDF page footers:', err.message);
  }
};

/** Builds the complete book PDF and resolves with a Buffer. */
const buildBookPdf = async (book) => {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
    bufferPages: true,
    info: {
      Title: book.title || 'Untitled eBook',
      Author: book.author || '',
      Producer: 'AI eBook Creator',
      Creator: 'AI eBook Creator',
    },
  });

  const chunks = [];
  const finished = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  await drawCoverPage(doc, book);
  if ((book.chapters || []).length) drawTableOfContents(doc, book);
  for (let i = 0; i < (book.chapters || []).length; i += 1) {
    await drawChapter(doc, book, book.chapters[i], i);
  }
  addPageFooters(doc, book);
  doc.end();

  return finished;
};

module.exports = { buildBookPdf };
