export type NewsArticle = {
  id: number; article_title: string; article_url?: string; article_thumbnail_url?: string;
  created_at: string; publish_date?: string | null; ai_outlook?: unknown;
  categories?: { id?: number; name?: string }[];
};
export type NewsBriefing = { created_at?: string; synopsis?: string; scripture?: string; prayer?: string; stories?: { headline?: string; summary?: string }[] };

export function newsPreview(value: unknown, limit = 180) {
  if (typeof value !== 'string') return '';
  const paragraph = value.trim().split(/\n\s*\n/)[0].replace(/\s+/g, ' ');
  if (paragraph.length <= limit) return paragraph;
  const excerpt = paragraph.slice(0, limit + 1);
  const boundary = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, boundary > limit / 2 ? boundary : limit).trimEnd()}…`;
}
export function articlePreview(article: NewsArticle, limit = 180) {
  let outlook = article.ai_outlook;
  if (typeof outlook === 'string') { try { outlook = JSON.parse(outlook); } catch { return ''; } }
  if (!outlook || typeof outlook !== 'object') return '';
  const value = outlook as { tldr?: { summary?: unknown }; synopsis?: unknown; newsSummary?: unknown };
  const summary = [value.tldr?.summary, value.synopsis, value.newsSummary].find(text => typeof text === 'string' && text.trim());
  return newsPreview(summary, limit);
}
export function newsRelativeTime(dateString: string, now = Date.now()) {
  const date = new Date(dateString), seconds = Math.floor((now - date.getTime()) / 1000);
  if (!Number.isFinite(date.getTime())) return '';
  if (seconds < 0) return date.toLocaleDateString();
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
