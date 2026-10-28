const axios = require('axios');
const { ApiError } = require('../utils/asyncHandler');
const { WRITING_STYLES } = require('../utils/constants');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 90000;

// Gemini answers 429/503 with "high demand" spikes several times a minute, so a
// single attempt turns a transient blip into a user-facing 502.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503]);
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND']);
const RETRY_DELAYS_MS = [2000, 5000, 10000];
// Anything the provider asks us to wait longer than this is not a transient
// spike (e.g. a daily quota), so retrying would only stall the user.
const MAX_RETRY_WAIT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (err) => {
  if (err.code === 'ECONNABORTED') return false;
  if (err.response) return RETRYABLE_STATUS.has(err.response.status);
  return RETRYABLE_CODES.has(err.code);
};

/** Reads the provider's requested wait, from Retry-After or the body's RetryInfo. */
const parseRetryAfterMs = (err) => {
  const header = Number(err.response?.headers?.['retry-after']);
  if (Number.isFinite(header) && header > 0) return header * 1000;

  const details = err.response?.data?.error?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      const match = /^(\d+(?:\.\d+)?)s$/.exec(String(detail?.retryDelay || ''));
      if (match) return Math.round(Number(match[1]) * 1000);
    }
  }
  return null;
};

/** null means "do not retry". */
const retryDelayMs = (err, attempt) => {
  const explicit = parseRetryAfterMs(err);
  if (explicit !== null) return explicit <= MAX_RETRY_WAIT_MS ? explicit : null;
  return RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
};

const formatWait = (ms) => {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

const assertApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(
      503,
      'AI generation is not configured on this server. Set GEMINI_API_KEY in server/.env and restart the backend.'
    );
  }
  return process.env.GEMINI_API_KEY;
};

const toMessage = (err) => {
  const status = err.response?.status;
  const upstream = err.response?.data?.error?.message || err.message;

  if (err.code === 'ECONNABORTED') {
    return new ApiError(504, 'The AI request timed out. Please try again.');
  }
  if (status === 429) {
    const waitMs = parseRetryAfterMs(err);
    if (/quota/i.test(upstream)) {
      const resets = waitMs ? ` (resets in about ${formatWait(waitMs)})` : '';
      return new ApiError(
        429,
        `The daily AI quota for this Gemini key is used up${resets}. Try again later, or add billing to raise the limit.`
      );
    }
    return new ApiError(429, 'The AI provider is rate limiting requests. Please wait a moment and try again.');
  }
  if (status === 401 || status === 403) {
    return new ApiError(503, 'The configured Gemini API key was rejected. Check GEMINI_API_KEY in server/.env.');
  }
  if (status === 404) {
    return new ApiError(503, `Gemini model "${MODEL}" is not available for this API key. Set GEMINI_MODEL in server/.env.`);
  }
  if (status === 500 || status === 503) {
    return new ApiError(503, 'The AI service is busy right now. Please try again in a moment.');
  }
  if (status === 502) {
    return new ApiError(502, 'The AI provider is temporarily unavailable. Please try again shortly.');
  }
  console.error('Gemini request failed:', status, upstream);
  return new ApiError(502, 'AI generation failed on the provider side. Please try again.');
};

/** Performs a generateContent call, retrying once if a config field is unsupported. */
const generateContent = async (prompt, generationConfig) => {
  const key = assertApiKey();
  const url = `${API_BASE}/${MODEL}:generateContent`;

  const attempt = async (config) => {
    for (let tries = 0; ; tries += 1) {
      try {
        return await axios.post(
          url,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: config,
          },
          { params: { key }, timeout: TIMEOUT_MS }
        );
      } catch (err) {
        if (tries >= RETRY_DELAYS_MS.length || !isRetryable(err)) throw err;
        const wait = retryDelayMs(err, tries);
        if (wait === null) throw err;
        console.warn(
          `Gemini ${MODEL} attempt ${tries + 1} failed (${err.response?.status || err.code}), retrying in ${wait}ms`
        );
        await sleep(wait);
      }
    }
  };

  let response;
  try {
    response = await attempt(generationConfig);
  } catch (err) {
    const upstream = err.response?.data?.error?.message || '';
    const unknownField = err.response?.status === 400 && /unknown name|unsupported|thinkingConfig/i.test(upstream);
    if (unknownField) {
      const { thinkingConfig, ...rest } = generationConfig;
      try {
        response = await attempt(rest);
      } catch (retryErr) {
        throw toMessage(retryErr);
      }
    } else {
      throw toMessage(err);
    }
  }

  const data = response.data;
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part.text || '').join('').trim();

  if (!text) {
    throw new ApiError(502, 'The AI returned an empty response. Please try again.');
  }
  return text;
};

const baseConfig = (json) => ({
  temperature: 0.8,
  maxOutputTokens: 8192,
  ...(json ? { responseMimeType: 'application/json' } : {}),
  // Newer flash models support disabling the thinking budget; older ones
  // reject the field and generateContent() retries without it.
  thinkingConfig: { thinkingBudget: 0 },
});

const extractJson = (raw) => {
  const candidates = [raw, raw.replace(/```(?:json)?/gi, '')];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) candidates.push(raw.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.trim());
    } catch (err) {
      /* try next candidate */
    }
  }
  return null;
};

const normalizeStyle = (style) =>
  WRITING_STYLES.includes(style) ? style : 'Informative';

/**
 * Generates a structured chapter outline as
 * [{ title, description }] using Google Gemini.
 */
const generateOutline = async ({ title, chapterCount, topic, style }) => {
  const count = Math.min(Math.max(Number(chapterCount) || 5, 1), 30);
  const writingStyle = normalizeStyle(style);

  const prompt = `You are a bestselling non-fiction book architect.

Design a chapter outline for a book with these details:
- Book title: "${title}"
- Topic / focus: ${topic ? topic : 'the book title itself'}
- Number of chapters: exactly ${count}
- Writing style: ${writingStyle}

Rules:
- Return EXACTLY ${count} chapters.
- Each chapter needs a compelling, specific title (3-8 words) and a 1-2 sentence description of what the chapter covers.
- Order the chapters so the book flows logically from introduction to conclusion.
- Output MUST be a single valid JSON object with this exact shape and nothing else:
{"chapters":[{"title":"Chapter title","description":"Chapter description"}]}`;

  const raw = await generateContent(prompt, baseConfig(true));
  const parsed = extractJson(raw);
  const list = Array.isArray(parsed?.chapters) ? parsed.chapters : Array.isArray(parsed) ? parsed : null;

  if (!list) {
    throw new ApiError(502, 'The AI returned an invalid outline. Please try generating again.');
  }

  const chapters = list
    .map((chapter) => ({
      title: String(chapter?.title || '').trim().slice(0, 200),
      description: String(chapter?.description || '').trim().slice(0, 1000),
    }))
    .filter((chapter) => chapter.title)
    .slice(0, count);

  if (!chapters.length) {
    throw new ApiError(502, 'The AI returned an empty outline. Please try again.');
  }
  return chapters;
};

/**
 * Generates full chapter content in Markdown using Google Gemini.
 */
const generateChapter = async ({
  bookTitle,
  bookSubtitle,
  chapterTitle,
  chapterDescription,
  chapterNumber,
  totalChapters,
  existingContent,
  style,
  outline,
}) => {
  const writingStyle = normalizeStyle(style);
  const hasExisting = Boolean(existingContent && existingContent.trim());

  const prompt = `You are an expert author writing a complete book chapter in Markdown.

BOOK CONTEXT
- Title: "${bookTitle}"
${bookSubtitle ? `- Subtitle: "${bookSubtitle}"` : ''}
- Overall style: ${writingStyle}
${outline ? `- Full outline:\n${outline}` : ''}

THIS CHAPTER
- Chapter ${chapterNumber} of ${totalChapters}: "${chapterTitle}"
- Chapter focus: ${chapterDescription || 'Cover the topic of the chapter title thoroughly.'}
${hasExisting ? `- Existing draft to improve and extend (keep its good parts):\n"""\n${existingContent}\n"""` : ''}

REQUIREMENTS
- Write a complete, publication-ready chapter of roughly 1200-1800 words.
- Use Markdown: "# " only for the chapter H1 (use the chapter title), "## " and "### " for sections, bullet and numbered lists, bold/italic for emphasis, blockquotes for callouts, and fenced code blocks when code helps.
- Include concrete examples, actionable advice and smooth transitions.
- Do NOT repeat the chapter title as a separate line outside the H1 heading.
- Do NOT wrap the whole answer in a code fence.
- Output ONLY the Markdown content of the chapter, no preamble and no commentary.`;

  let content = await generateContent(prompt, baseConfig(false));

  content = content
    .replace(/^```(?:markdown|md)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  if (content.length < 40) {
    throw new ApiError(502, 'The AI returned an unexpectedly short chapter. Please try again.');
  }
  return content;
};

module.exports = { generateOutline, generateChapter, MODEL };
