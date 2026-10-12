const INVITE_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validToken = (value: string | null | undefined) => value && INVITE_TOKEN_PATTERN.test(value.trim()) ? value.trim() : null;

export const extractInviteToken = (input: string | null | undefined): string | null => {
  const value = input?.trim();
  if (!value) return null;
  const raw = validToken(value);
  if (raw) return raw;
  try {
    const url = new URL(value);
    const webInvite = url.protocol === 'https:' && ['sanctuaryapp.us', 'www.sanctuaryapp.us'].includes(url.hostname) && !url.port && !url.username && !url.password;
    const nativeInvite = url.protocol === 'sanctuary:' && !url.username && !url.password && !url.port;
    if (!webInvite && !nativeInvite) return null;
    const parts = [nativeInvite ? url.hostname : '', ...url.pathname.split('/')].filter(Boolean);
    if (parts[0] !== 'join' || parts.length > 2) return null;
    const queryTokens = url.searchParams.getAll('token');
    if (queryTokens.length > 1) return null;
    const pathToken = parts[1] ? validToken(decodeURIComponent(parts[1])) : null;
    const queryToken = validToken(queryTokens[0]);
    if (parts[1] && !pathToken) return null;
    if (queryTokens.length && !queryToken) return null;
    if (pathToken && queryToken && pathToken.toLowerCase() !== queryToken.toLowerCase()) return null;
    return pathToken ?? queryToken;
  } catch { return null; }
};
