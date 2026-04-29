/**
 * Parse YouTube count strings like "1.2M", "300K", "1,234,567" → number.
 */
export function parseYouTubeCount(input: string | null | undefined): number {
  if (!input) return 0;
  const trimmed = input.trim();
  if (!trimmed) return 0;

  // Strip non-numeric ornaments (subscribers / views / etc.)
  const cleaned = trimmed.replace(/[^\d.,KkMmBb]/g, '');
  if (!cleaned) return 0;

  const lastChar = cleaned.slice(-1).toUpperCase();
  const multiplierMap: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  if (multiplierMap[lastChar] !== undefined) {
    const numericPart = cleaned.slice(0, -1).replace(/,/g, '');
    const num = parseFloat(numericPart);
    if (Number.isNaN(num)) return 0;
    return Math.round(num * multiplierMap[lastChar]);
  }

  // Plain number with commas/dots
  const num = parseInt(cleaned.replace(/[,.\s]/g, ''), 10);
  return Number.isNaN(num) ? 0 : num;
}

/** Parse YouTube channel URL/handle → externalId or handle. */
export function parseYouTubeChannelUrl(url: string): {
  externalId: string | null;
  handle: string | null;
} {
  // Patterns:
  // https://www.youtube.com/channel/UCxxxx
  // https://www.youtube.com/@handle
  // https://www.youtube.com/c/customname
  // https://www.youtube.com/user/legacy

  const channelMatch = url.match(/youtube\.com\/channel\/(UC[\w-]{20,})/i);
  if (channelMatch) return { externalId: channelMatch[1], handle: null };

  const handleMatch = url.match(/youtube\.com\/(@[\w.-]+)/i);
  if (handleMatch) return { externalId: null, handle: handleMatch[1] };

  const customMatch = url.match(/youtube\.com\/c\/([\w.-]+)/i);
  if (customMatch) return { externalId: null, handle: customMatch[1] };

  const userMatch = url.match(/youtube\.com\/user\/([\w.-]+)/i);
  if (userMatch) return { externalId: null, handle: userMatch[1] };

  return { externalId: null, handle: null };
}
