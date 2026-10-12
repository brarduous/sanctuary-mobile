import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatReadingHtml } from '../lib/readingHtml.ts';
const text = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s/g, '');
let chapters = 0;
for (const version of ['web', 'asv', 'niv', 'kjv']) {
  const bible = JSON.parse(readFileSync(new URL(`../assets/bible/${version}-optimized.json`, import.meta.url)));
  for (const book of [...bible.oldTestament, ...bible.newTestament]) {
    for (const chapter of book.chapters) {
      const rendered = formatReadingHtml(chapter.content);
      assert.equal(text(rendered), text(chapter.content), `${version} ${book.title} ${chapter.number}: preserve scripture`);
      const verses = chapter.content.match(/<sup\b/g)?.length || 0;
      assert.equal(rendered.match(/<sup\b/g)?.length || 0, verses, 'preserve every verse number');
      if (verses) assert.match(rendered, /<\/sup>&nbsp;<span/, 'separate verse number from text');
      chapters++;
    }
  }
}
assert.equal(formatReadingHtml(''), '');
assert.equal(formatReadingHtml('<p>No verse markup</p>'), '<p>No verse markup</p>');
console.log(`Verified scripture preservation and verse spacing across ${chapters} chapters in four translations.`);
