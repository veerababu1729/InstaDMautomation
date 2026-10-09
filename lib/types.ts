// lib/types.ts
export interface AutomationConfig {
  enabled: boolean;
  triggerKeywords: string[];         // Empty = trigger on ANY comment
  triggerMediaUrl?: string;          // Optional: Specific Instagram Reel/Post URL to trigger on
  replyComment: string;              // Public reply template (use {name})
  dmMessage: string;                 // DM message body (use {name})
  dmLinks: { label: string; url: string }[];
  requireFollow: boolean;            // Only DM if user follows the page
  mediaFilter: 'all' | 'reels' | 'posts'; // Which media types to watch
}

export interface PageConfig {
  id: string;
  name: string;
  igUserId: string;                  // Instagram Business Account ID
  pageAccessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  automation: AutomationConfig;
  createdAt: string;
  stats: {
    totalDmsSent: number;
    totalCommentsTrigger: number;
    lastActivity: string | null;
  };
}

export interface EventLog {
  id: string;
  pageId: string;
  timestamp: string;
  type: 'comment_received' | 'reply_sent' | 'dm_sent' | 'dm_skipped' | 'error';
  commenterId: string;
  commenterName: string;
  commentText: string;
  mediaId: string;
  details?: string;
}
