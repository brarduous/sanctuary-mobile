const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

// Share complete supplied sentences. Cutting news at a character/word boundary
// can remove an attribution or qualifier and change the meaning.
export function newsShareText(input: { title?: unknown; summary?: unknown; reflection?: unknown; sourceUrl?: unknown }): string {
  const source = text(input.sourceUrl);
  return [
    text(input.title),
    text(input.summary),
    text(input.reflection) ? `Faith reflection: ${text(input.reflection)}` : '',
    /^https?:\/\/\S+$/i.test(source) ? `Source: ${source}` : '',
    'Shared via Sanctuary',
  ].filter(Boolean).join('\n\n');
}

export function devotionalShareText(input: { title?: unknown; scripture?: unknown; slides?: { text: string }[]; content?: unknown }, full = false): string {
  const slides = input.slides?.filter(slide => text(slide.text)).map(slide => text(slide.text)) || [];
  const body = !full && slides.length === 3 ? slides.join('\n\n') : text(input.content);
  return [text(input.title), text(input.scripture), body, 'Shared via Sanctuary'].filter(Boolean).join('\n\n');
}

export function adviceShareText(steps: unknown[], reference?: unknown): string {
  const actions = steps.map(text).filter(Boolean).map((step, index) => `${index + 1}. ${step}`);
  return ['Three next steps', ...actions, text(reference) ? `Read: ${text(reference)}` : '', 'Shared via Sanctuary'].filter(Boolean).join('\n\n');
}
