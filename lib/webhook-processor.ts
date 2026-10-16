// lib/webhook-processor.ts
// Shared logic for processing Instagram/Page webhook comment events

import { listPages, getPage, appendEvent, updateAutomationStats } from '@/lib/store';
import { replyToComment, sendDM, doesUserFollow, getUserInfo } from '@/lib/instagram';
import { EventLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function processEntries(body: any): Promise<void> {
  if (body.object !== 'instagram' && body.object !== 'page') {
    console.log(`[Webhook] Ignoring non-Instagram/Page object: ${body.object}`);
    return;
  }

  const pages = await listPages();
  if (pages.length === 0) {
    console.warn('[Webhook] No pages configured in store');
    return;
  }

  for (const entry of body.entry ?? []) {
    const entryId = entry.id;
    // Find page by igUserId or id
    let page = pages.find(
      p => p.igUserId === entryId || p.id === entryId
    );

    // Fallback: if only one page exists in store, route to it
    if (!page && pages.length === 1) {
      console.log(`[Webhook] Fallback matching single registered page (${pages[0].id}) for entry.id=${entryId}`);
      page = pages[0];
    }

    if (!page) {
      console.warn(`[Webhook] No matching page found for entry.id: ${entryId}`);
      continue;
    }

    // Process comment changes
    for (const change of entry.changes ?? []) {
      if (change.field === 'comments' || change.field === 'live_comments') {
        await handleCommentEvent(page.id, change);
      } else {
        console.log(`[Webhook] Skipping unhandled field: ${change.field}`);
      }
    }
  }
}

export async function handleCommentEvent(
  pageId: string,
  change: any
): Promise<void> {
  const page = await getPage(pageId);
  if (!page) return;

  const value = change.value;
  if (!value) {
    console.warn('[Webhook] change.value is empty');
    return;
  }

  // Meta Instagram payload:
  // - value.id is the comment ID
  // - value.text is the comment text
  // - value.from.id is the commenter IG user ID
  // - value.media.id is the post/reel media ID
  // - value.media.media_product_type is 'REELS' | 'FEED' | 'STORY' | 'AD'
  const commentId = value.id || value.comment_id;
  const commenterId = value.from?.id;
  const commenterName = value.from?.username || 'there';
  const commentText = value.text || '';
  const mediaId = value.media?.id || value.media_id || '';
  const mediaProductType = value.media?.media_product_type || '';

  console.log(`[Webhook] Comment parsed:`, {
    commentId,
    commenterId,
    commenterName,
    commentText,
    mediaId,
    mediaProductType,
  });

  if (!commentId || !commenterId) {
    console.warn('[Webhook] Missing commentId or commenterId, cannot proceed');
    return;
  }

  // Prevent self-reply loop if page comments on its own post
  if (commenterId === page.igUserId || commenterId === page.id) {
    console.log('[Webhook] Comment is from page account itself, ignoring to prevent loop');
    return;
  }

  const enabledRules = (page.automations || []).filter(a => a.enabled);
  if (enabledRules.length === 0) {
    console.log(`[Webhook] Page ${pageId} has no enabled automations`);
    return;
  }

  console.log(`[Webhook] Evaluating ${enabledRules.length} enabled automation rule(s)`);

  for (const rule of enabledRules) {
    console.log(`[Webhook] Testing rule "${rule.name}" (${rule.id})...`);

    // ── 1. Specific Media ID Filter ───────────────────────────────────────────
    if (rule.targetMediaId) {
      if (mediaId && mediaId !== rule.targetMediaId) {
        console.log(`[Webhook] Target media mismatch: rule expects ${rule.targetMediaId}, comment on ${mediaId}`);
        continue;
      }
    }

    // ── 2. Media Type Filter (reels vs posts) ─────────────────────────────────
    if (rule.mediaFilter && rule.mediaFilter !== 'all') {
      if (mediaProductType) {
        const isReel = mediaProductType.toUpperCase() === 'REELS' || mediaProductType.toUpperCase() === 'VIDEO';
        if (rule.mediaFilter === 'reels' && !isReel) {
          console.log(`[Webhook] Rule requires reels, media is ${mediaProductType}`);
          continue;
        }
        if (rule.mediaFilter === 'posts' && isReel) {
          console.log(`[Webhook] Rule requires posts, media is ${mediaProductType}`);
          continue;
        }
      } else if (mediaId) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${mediaId}?fields=media_type&access_token=${page.pageAccessToken}`
          );
          const data = await res.json();
          const isReel = data.media_type === 'VIDEO';
          if (rule.mediaFilter === 'reels' && !isReel) continue;
          if (rule.mediaFilter === 'posts' && isReel) continue;
        } catch {
          // If check fails, allow through
        }
      }
    }

    // ── 3. Keyword Filter ─────────────────────────────────────────────────────
    const activeKeywords = (rule.triggerKeywords || [])
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    if (activeKeywords.length > 0) {
      const lower = commentText.toLowerCase().trim();
      const matched = activeKeywords.some(kw => lower.includes(kw));
      if (!matched) {
        console.log(`[Webhook] Keyword mismatch: [${activeKeywords.join(', ')}] not found in "${commentText}"`);
        continue;
      }
    }

    // Rule matched!
    console.log(`[Webhook] >>> Rule "${rule.name}" MATCHED! Triggering automation.`);
    await runAutomation(page.id, rule.id, {
      commenterId,
      commenterName,
      commentText,
      mediaId,
      commentId,
    });

    // First matching rule wins per comment
    break;
  }
}

export async function runAutomation(
  pageId: string,
  automationId: string,
  ctx: {
    commenterId: string;
    commenterName: string;
    commentText: string;
    mediaId: string;
    commentId: string;
  }
): Promise<void> {
  const page = await getPage(pageId);
  if (!page) return;
  const rule = page.automations.find(a => a.id === automationId);
  if (!rule) return;

  const { commenterId, commenterName, commentText, mediaId, commentId } = ctx;

  await updateAutomationStats(pageId, automationId, { commentsTrigger: 1 });

  const baseLog: Omit<EventLog, 'type' | 'details'> = {
    id: uuidv4(),
    pageId,
    automationId,
    timestamp: new Date().toISOString(),
    commenterId,
    commenterName,
    commentText,
    mediaId,
  };

  await appendEvent({ ...baseLog, type: 'comment_received' });

  // ── 1. Reply to comment (public reply) ──────────────────────────────────────
  if (rule.replyComment && rule.replyComment.trim()) {
    const replyText = rule.replyComment
      .replace(/{name}/g, commenterName)
      .replace(/{username}/g, commenterName);

    try {
      console.log(`[Automation] Replying to comment ${commentId}: "${replyText}"`);
      await replyToComment(commentId, replyText, page.pageAccessToken);
      await appendEvent({ ...baseLog, id: uuidv4(), type: 'reply_sent' });
      console.log(`[Automation] Successfully replied to comment ${commentId}`);
    } catch (err: any) {
      console.error(`[Automation] Error replying to comment ${commentId}:`, err?.message || err);
      await appendEvent({
        ...baseLog,
        id: uuidv4(),
        type: 'error',
        details: `Reply error: ${err?.message || String(err)}`,
      });
    }
  }

  // ── 2. Follow gate ──────────────────────────────────────────────────────────
  if (rule.requireFollow) {
    try {
      const follows = await doesUserFollow(page.igUserId, commenterId, page.pageAccessToken);
      if (!follows) {
        console.log(`[Automation] User @${commenterName} does not follow page; DM skipped.`);
        await appendEvent({
          ...baseLog,
          id: uuidv4(),
          type: 'dm_skipped',
          details: 'User does not follow page',
        });
        return;
      }
    } catch (err) {
      console.warn('[Automation] Follow check warning:', err);
    }
  }

  // ── 3. Send DM (Private Reply via comment_id) ───────────────────────────────
  if (rule.dmMessage && rule.dmMessage.trim()) {
    let displayName = commenterName;
    try {
      const userInfo = await getUserInfo(commenterId, page.pageAccessToken);
      if (userInfo?.name) displayName = userInfo.name;
    } catch {}

    const dmText = rule.dmMessage
      .replace(/{name}/g, displayName)
      .replace(/{username}/g, commenterName);

    try {
      console.log(`[Automation] Sending private reply DM for comment ${commentId} to @${commenterName}`);
      await sendDM(
        page.igUserId,
        { commentId, igId: commenterId },
        dmText,
        rule.dmLinks || [],
        page.pageAccessToken
      );
      await appendEvent({ ...baseLog, id: uuidv4(), type: 'dm_sent' });
      await updateAutomationStats(pageId, automationId, { dmsSent: 1 });
      console.log(`[Automation] Successfully sent private reply DM to @${commenterName}!`);
    } catch (err: any) {
      console.error(`[Automation] Error sending DM to @${commenterName}:`, err?.message || err);
      await appendEvent({
        ...baseLog,
        id: uuidv4(),
        type: 'error',
        details: `DM error: ${err?.message || String(err)}`,
      });
    }
  }
}
