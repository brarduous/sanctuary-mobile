const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sanitizeToken = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const decoded = decodeURIComponent(trimmed);
    return decoded.trim() || null;
  } catch {
    return trimmed;
  }
};

export const extractInviteToken = (input: string | null | undefined): string | null => {
  const normalizedInput = sanitizeToken(input);
  if (!normalizedInput) return null;

  if (UUID_V4_PATTERN.test(normalizedInput)) {
    return normalizedInput;
  }

  try {
    const url = new URL(normalizedInput);
    const queryToken = sanitizeToken(url.searchParams.get('token'));
    if (queryToken) return queryToken;

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const lastSegment = sanitizeToken(pathSegments[pathSegments.length - 1]);
    if (lastSegment && UUID_V4_PATTERN.test(lastSegment)) {
      return lastSegment;
    }
  } catch {
    const tokenMatch = normalizedInput.match(/[?&]token=([^&]+)/i);
    const fallbackToken = sanitizeToken(tokenMatch?.[1]);
    if (fallbackToken) return fallbackToken;
  }

  return null;
};
