/**
 * A small, dependency-free Markdown parser that turns Markdown into a flat
 * list of blocks. Both the PDF and DOCX exporters render from this structure,
 * so export output stays consistent across formats.
 *
 * Blocks:
 *  { type: 'heading', level, text, align }
 *  { type: 'paragraph', text, align }
 *  { type: 'list', ordered, items: [{ text, align }] }
 *  { type: 'code', text, lang }
 *  { type: 'quote', text, align }
 *  { type: 'image', alt, src }
 *  { type: 'hr' }
 */

const stripInlineHtml = (text) =>
  text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const ALIGN_OPEN = /<\s*(?:div|p|center)\s+align\s*=\s*["']?(left|center|right)["']?\s*>\s*$/i;
const ALIGN_INLINE = /^<\s*(?:div|p|center)\s+align\s*=\s*["']?(left|center|right)["']?\s*>\s*([\s\S]+?)\s*<\s*\/\s*(?:div|p|center)\s*>\s*$/i;
const ALIGN_CLOSE = /<\s*\/\s*(?:div|p|center)\s*>\s*$/i;

const markdownToBlocks = (markdown) => {
  const lines = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const blocks = [];
  let align = 'left';
  let i = 0;

  const pushParagraph = (buffer, paragraphAlign) => {
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'paragraph', text: stripInlineHtml(text), align: paragraphAlign });
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const inlineAlign = trimmed.match(ALIGN_INLINE);
    if (inlineAlign) {
      const text = stripInlineHtml(inlineAlign[2].trim());
      if (text) blocks.push({ type: 'paragraph', text, align: inlineAlign[1].toLowerCase() });
      i += 1;
      continue;
    }

    const openAlign = trimmed.match(ALIGN_OPEN);
    if (openAlign) {
      align = openAlign[1].toLowerCase();
      i += 1;
      continue;
    }
    if (ALIGN_CLOSE.test(trimmed)) {
      align = 'left';
      i += 1;
      continue;
    }

    // Fenced code block
    const fence = trimmed.match(/^```(\S*)\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      const buffer = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        buffer.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', text: buffer.join('\n'), lang });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: stripInlineHtml(heading[2].replace(/\s+#+\s*$/, '').trim()),
        align,
      });
      i += 1;
      continue;
    }

    // Standalone image
    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
    if (image) {
      blocks.push({ type: 'image', alt: image[1], src: image[2] });
      i += 1;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const buffer = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buffer.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ type: 'quote', text: stripInlineHtml(text), align });
      continue;
    }

    // Lists (bullet or ordered)
    const bullet = /^\s*[-*+]\s+/;
    const ordered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line);
      const items = [];
      while (i < lines.length) {
        const current = lines[i];
        if (!current.trim()) {
          const next = lines[i + 1];
          if (next && /^\s+/.test(next) && !bullet.test(next) && !ordered.test(next)) {
            items[items.length - 1] = `${items[items.length - 1]} ${next.trim()}`;
            i += 2;
            continue;
          }
          break;
        }
        const matcher = isOrdered ? ordered : bullet;
        if (!matcher.test(current)) break;
        items.push(stripInlineHtml(current.replace(matcher, '').trim()));
        i += 1;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items: items.map((text) => ({ text, align })) });
      continue;
    }

    // Paragraph (greedy until blank line / next block marker)
    const buffer = [trimmed];
    let paragraphAlign = align;
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      const nextTrimmed = next.trim();
      if (
        !nextTrimmed ||
        /^```/.test(nextTrimmed) ||
        /^#{1,6}\s/.test(nextTrimmed) ||
        /^\s*[-*+]\s+/.test(next) ||
        /^\s*\d+[.)]\s+/.test(next) ||
        nextTrimmed.startsWith('>') ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nextTrimmed) ||
        ALIGN_OPEN.test(nextTrimmed) ||
        ALIGN_CLOSE.test(nextTrimmed) ||
        ALIGN_INLINE.test(nextTrimmed)
      ) {
        break;
      }
      buffer.push(nextTrimmed);
      i += 1;
    }
    pushParagraph(buffer, paragraphAlign);
  }

  return blocks;
};

module.exports = { markdownToBlocks, stripInlineHtml };
