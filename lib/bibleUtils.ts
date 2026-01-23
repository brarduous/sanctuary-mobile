
export const SCRIPTURE_REGEX = /(\b(?:[1-3]\s)?[A-Za-z]{2,}(?:\s+[A-Za-z]{2,})*\s+\d+(?::\d+(?:-\d+)?)?)/g;

// Local Bible files (same as Bible screen)
const BIBLE_FILES: Record<string, any> = {
  WEB: require('@/assets/bible/web-optimized.json'),
  ASV: require('@/assets/bible/asv-optimized.json'),
  NIV: require('@/assets/bible/niv-optimized.json'),
  KJV: require('@/assets/bible/kjv-optimized.json'),
};

export type ParsedReference = {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export function parseScriptureReference(ref: string): ParsedReference | null {
  const match = ref.trim().match(/^\s*([1-3]?\s?[A-Za-z\.\s]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$/i);
  if (!match) return null;
  const [, rawBook, ch, start, end] = match;
  const chapter = parseInt(ch, 10);
  const startVerse = start ? parseInt(start, 10) : undefined;
  const endVerse = end ? parseInt(end, 10) : startVerse;
  return {
    book: normalize(rawBook.replace(/\./g, '')),
    chapter,
    startVerse,
    endVerse,
  };
}

function findBook(bibleData: any, bookName: string) {
  const target = normalize(bookName).toLowerCase();
  return [...(bibleData?.oldTestament || []), ...(bibleData?.newTestament || [])]
    .find((b: any) => normalize(b.title).toLowerCase() === target || normalize(b.id).toLowerCase() === target);
}

export function getPassageHtml(reference: string, versionKey: string = 'WEB'): { html: string; title: string } | null {
  const parsed = parseScriptureReference(reference);
  const bibleData = BIBLE_FILES[versionKey] || BIBLE_FILES.WEB;
  if (!parsed || !bibleData) return null;

  const book = findBook(bibleData, parsed.book);
  if (!book) return null;
  const chapter = (book.chapters || []).find((c: any) => c.number === parsed.chapter);
  if (!chapter) return null;

  const matches = Array.from(
    (chapter.content || '').matchAll(/<sup class="v">(\d+)<\/sup><span>(.*?)<\/span>/g)
  );

  let html = '';
  if (matches.length === 0) {
    html = chapter.content || '';
  } else {
    const start = parsed.startVerse || Number((matches[0] as any)[1]);
    const end = parsed.endVerse || start;
    const filtered = matches.filter((m) => {
      const v = Number((m as any)[1]);
      return v >= start && v <= end;
    });
    html = filtered.length > 0 ? filtered.map((m) => `<sup class="v">${(m as any)[1]}</sup><span>${(m as any)[2]}</span>`).join(' ') : chapter.content;
  }

  return { html, title: `${book.title} ${parsed.chapter}${parsed.startVerse ? ':' + parsed.startVerse + (parsed.endVerse && parsed.endVerse !== parsed.startVerse ? '-' + parsed.endVerse : '') : ''}` };
}
