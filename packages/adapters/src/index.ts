/**
 * AFANTA — @afanta/adapters public API
 */

export type {
  AdapterLogger,
  ChannelInsightResult,
  ChannelRef,
  CheckpointStatus,
  IPlatformAdapter,
  PlatformName,
  ProxyConfig,
  SessionStatus,
  TopVideoItem,
} from './types';
export { YouTubeAdapter } from './youtube/youtube-adapter';
export { parseYouTubeCount, parseYouTubeChannelUrl } from './youtube/parsers';
