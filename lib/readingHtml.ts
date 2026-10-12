/** The bundled translations contain sequential sup/span verse pairs. */
export function formatReadingHtml(html: string): string {
  if (!html.includes('<sup')) return html;
  return '<div>' + html.split(/(?=<sup\b)/).filter(Boolean)
    .map(verse => '<p>' + verse.replace(/<\/sup>\s*(?=<span\b)/, '</sup>&nbsp;') + '</p>')
    .join('') + '</div>';
}
