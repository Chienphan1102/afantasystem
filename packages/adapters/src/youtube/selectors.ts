/**
 * AFANTA — YouTube DOM Selectors
 * Tách riêng để dễ update khi YouTube đổi UI.
 *
 * Cập nhật lần cuối: 2026-04-29 (Phase 1 MVP)
 */

export const YT_SELECTORS = {
  // Channel page (/channel/{id} or /@handle)
  channelHandle: 'meta[itemprop="identifier"], #channel-handle',
  subscriberCount:
    'yt-formatted-string#subscriber-count, #subscriber-count, .ytd-c4-tabbed-header-renderer #subscriber-count',
  channelName: 'yt-formatted-string#text.ytd-channel-name, #channel-name #text',

  // /about page
  aboutSubscribers:
    'yt-formatted-string#subscriber-count, table.ytd-about-channel-renderer #subscribers, .style-scope.ytd-about-channel-renderer:has(yt-icon[icon="people"])',
  aboutViews:
    'table.ytd-about-channel-renderer tr:has(yt-icon[icon="trending_up"]), .ytd-about-channel-renderer:has(yt-icon[icon="trending_up"])',

  // /videos tab
  videoGrid: 'ytd-rich-grid-renderer #contents, ytd-grid-renderer #items',
  videoItem: 'ytd-rich-item-renderer, ytd-grid-video-renderer',
  videoTitle: 'a#video-title-link, a#video-title',
  videoMetadata: '#metadata-line span',
  videoThumbnail: 'img#img',
} as const;
