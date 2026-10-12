/** The bundled translations contain sequential sup/span verse pairs. */
export function formatReadingHtml(html: string): string {
  if (!html.includes('<sup')) return html;
  return '<div>' + html.split(/(?=<sup\b)/).filter(Boolean)
    .map(verse => '<p>' + verse.replace(/<\/sup>\s*(?=<span\b)/, '</sup>&nbsp;') + '</p>')
    .join('') + '</div>';
}

/** Legacy lesson rows can store references as a JSON string or an array. */
export function formatScriptureReferences(value: unknown): string {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).join('; ');
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? formatScriptureReferences(parsed) : trimmed;
  } catch { return trimmed; }
}
