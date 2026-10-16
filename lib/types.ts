// lib/types.ts

export interface AutomationRule {
  id: string;                            // Unique ID per rule
  name: string;                          // User-defined label e.g. "Reel #1 – Summer Drop"
  enabled: boolean;

  // ── Trigger ─────────────────────────────────────────────────────────────────
  triggerKeywords: string[];             // Empty = trigger on ANY comment
  triggerMediaUrl?: string;              // Display-only Instagram URL
  targetMediaId?: string;               // Resolved numeric media ID — filters comments to this post only
  mediaFilter: 'all' | 'reels' | 'posts';

  // ── Messages ─────────────────────────────────────────────────────────────────
  replyComment: string;                  // Public comment reply template (use {name})
  dmMessage: string;                     // DM body (use {name})
  dmLinks: { label: string; url: string }[];

  // ── Options ──────────────────────────────────────────────────────────────────
  requireFollow: boolean;                // Only DM if user follows

  // ── Stats (per-rule) ─────────────────────────────────────────────────────────
  stats: {
    totalDmsSent: number;
    totalCommentsTrigger: number;
    lastActivity: string | null;
  };

  createdAt: string;
}

// Legacy single-automation shape kept for backward-compat migration
export interface AutomationConfig {
  enabled: boolean;
  triggerKeywords: string[];
  triggerMediaUrl?: string;
  targetMediaId?: string;
  replyComment: string;
  dmMessage: string;
  dmLinks: { label: string; url: string }[];
  requireFollow: boolean;
  mediaFilter: 'all' | 'reels' | 'posts';
}

export interface PageConfig {
  id: string;
  name: string;
  igUserId: string;                      // Instagram Business Account ID
  pageAccessToken: string;
  appSecret: string;
  webhookVerifyToken: string;

  /** New: array of independent automation rules */
  automations: AutomationRule[];

  /** Legacy: kept for backward compat — will be migrated on first load */
  automation?: AutomationConfig;

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
  automationId?: string;                 // Which rule triggered this event
  timestamp: string;
  type: 'comment_received' | 'reply_sent' | 'dm_sent' | 'dm_skipped' | 'error';
  commenterId: string;
  commenterName: string;
  commentText: string;
  mediaId: string;
  details?: string;
}

/** Shape returned by the /api/pages/:id/media endpoint */
export interface IGMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}
