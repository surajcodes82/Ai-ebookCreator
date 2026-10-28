const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
} = require('docx');
const { markdownToBlocks } = require('../utils/markdown');

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const ALIGN_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

/** Inline Markdown -> docx runs. */
const toRuns = (text, base = {}) => {
  const runs = [];
  const pattern =
    /\[([^\]]+)\]\(([^)\s]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|~~([^~]+)~~|`([^`]+)`/g;

  let cursor = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      runs.push(new TextRun({ text: text.slice(cursor, match.index), ...base }));
    }
    if (match[1] !== undefined) {
      const label = match[1];
      const link = match[2];
      runs.push(
        new ExternalHyperlink({
          children: [new TextRun({ text: label, style: 'Hyperlink', ...base })],
          link,
        })
      );
    } else if (match[3] !== undefined) runs.push(new TextRun({ text: match[3], bold: true, italics: true, ...base }));
    else if (match[4] !== undefined) runs.push(new TextRun({ text: match[4], bold: true, ...base }));
    else if (match[5] !== undefined) runs.push(new TextRun({ text: match[5], bold: true, ...base }));
    else if (match[6] !== undefined) runs.push(new TextRun({ text: match[6], italics: true, ...base }));
    else if (match[7] !== undefined) runs.push(new TextRun({ text: match[7], italics: true, ...base }));
    else if (match[8] !== undefined) runs.push(new TextRun({ text: match[8], strike: true, ...base }));
    else if (match[9] !== undefined) runs.push(new TextRun({ text: match[9], font: 'Courier New', ...base }));
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) runs.push(new TextRun({ text: text.slice(cursor), ...base }));
  return runs.length ? runs : [new TextRun({ text: '', ...base })];
};

const buildBlocks = (blocks) => {
  const children = [];

  blocks.forEach((block) => {
    const alignment = ALIGN_MAP[block.align] || AlignmentType.LEFT;

    if (block.type === 'heading') {
      children.push(
        new Paragraph({
          heading: HEADING_MAP[block.level] || HeadingLevel.HEADING_4,
          alignment,
          spacing: { before: 260, after: 140 },
          children: toRuns(block.text, { bold: block.level <= 2 }),
        })
      );
      return;
    }

    if (block.type === 'hr') {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          border: { bottom: { style: 'single', size: 6, color: 'E5E7EB' } },
          children: [new TextRun({ text: '' })],
        })
      );
      return;
    }

    if (block.type === 'code') {
      block.text.split('\n').forEach((line, index) => {
        children.push(
          new Paragraph({
            shading: { fill: 'F3F4F6' },
            spacing: { before: index === 0 ? 120 : 0, after: index === 0 ? 0 : 40, line: 260 },
            children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 19 })],
          })
        );
      });
      return;
    }

    if (block.type === 'quote') {
      children.push(
        new Paragraph({
          alignment,
          spacing: { before: 80, after: 80 },
          indent: { left: 360 },
          border: { left: { style: 'single', size: 12, color: '7C3AED', space: 12 } },
          children: toRuns(block.text, { italics: true, color: '4B5563' }),
        })
      );
      return;
    }

    if (block.type === 'list') {
      block.items.forEach((item, index) => {
        children.push(
          new Paragraph({
            alignment: ALIGN_MAP[item.align] || AlignmentType.LEFT,
            bullet: block.ordered ? false : { level: 0 },
            numbering: undefined,
            spacing: { before: 40, after: 40 },
            indent: block.ordered ? { left: 360, hanging: 360 } : undefined,
            children: block.ordered
              ? [new TextRun({ text: `${index + 1}. `, bold: false }), ...toRuns(item.text)]
              : toRuns(item.text),
          })
        );
      });
      return;
    }

    if (block.type === 'image') {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: toRuns(`[${block.alt || 'Image'}]${block.src ? ` ${block.src}` : ''}`, {
            italics: true,
            color: '6B7280',
          }),
        })
      );
      return;
    }

    children.push(
      new Paragraph({
        alignment,
        spacing: { before: 60, after: 160, line: 300 },
        children: toRuns(block.text),
      })
    );
  });

  return children;
};

/** Builds the complete book DOCX and resolves with a Buffer. */
const buildBookDocx = async (book) => {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2200, after: 240 },
      children: [new TextRun({ text: book.title || 'Untitled eBook', bold: true, size: 72 })],
    })
  );

  if (book.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: book.subtitle, italics: true, size: 34, color: '6B7280' })],
      })
    );
  }

  if (book.author) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: `by ${book.author}`, size: 26, color: '7C3AED' })],
      })
    );
  }

  children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: '' })] }));

  if ((book.chapters || []).length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
        children: [new TextRun({ text: 'Contents', bold: true })],
      })
    );
    book.chapters.forEach((chapter, index) => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `Chapter ${index + 1}: `, bold: true, color: '7C3AED' }),
            new TextRun({ text: chapter.title }),
          ],
        })
      );
    });
    children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: '' })] }));
  }

  book.chapters.forEach((chapter, index) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: `Chapter ${index + 1}` })],
      })
    );
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 240 },
        children: [new TextRun({ text: chapter.title })],
      })
    );

    const blocks = markdownToBlocks(chapter.content || '');
    const firstHeading = blocks[0]?.type === 'heading' ? blocks[0].text.trim().toLowerCase() : null;
    const skipFirstHeading = firstHeading && firstHeading === String(chapter.title || '').trim().toLowerCase();
    const contentBlocks = skipFirstHeading ? blocks.slice(1) : blocks;

    if (!contentBlocks.length) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'This chapter has no content yet.', italics: true, color: '9CA3AF' })],
        })
      );
    } else {
      children.push(...buildBlocks(contentBlocks));
    }

    if (index < book.chapters.length - 1) {
      children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: '' })] }));
    }
  });

  const doc = new Document({
    creator: 'AI eBook Creator',
    title: book.title || 'Untitled eBook',
    description: book.subtitle || '',
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
};

module.exports = { buildBookDocx };
