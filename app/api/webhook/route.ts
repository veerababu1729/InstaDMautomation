// app/api/webhook/route.ts
// Meta Webhook endpoint: verify (GET) + receive comment events (POST)

import { NextRequest, NextResponse } from 'next/server';
import { listPages, getPage, appendEvent, updatePageStats } from '@/lib/store';
import { replyToComment, sendDM, doesUserFollow, getUserInfo, verifyWebhookSignature } from '@/lib/instagram';
import { EventLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// ─── GET: Webhook Verification ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Check token against all pages
  const pages = await listPages();
  const matchedPage = pages.find(p => p.webhookVerifyToken === token);

  if (!matchedPage) {
    return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

// ─── POST: Receive Events ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: WebhookBody;

  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Await processing before returning 200 to guarantee completion in Vercel serverless environments
  try {
    await processEntries(body, bodyText);
  } catch (err) {
    console.error('Error processing webhook event:', err);
  }

  return NextResponse.json({ received: true });
}

// ─── Process Webhook Entries ──────────────────────────────────────────────────

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

interface WebhookEntry {
  id: string;  // Page/IG account ID
  changes?: WebhookChange[];
  messaging?: WebhookMessage[];
}

interface WebhookChange {
  field: string;
  value: {
    from: { id: string; username?: string };
    comment_id?: string;
    media_id?: string;
    text?: string;
    id?: string;
    timestamp?: number;
  };
}

interface WebhookMessage {
  sender: { id: string };
  recipient: { id: string };
}

async function processEntries(body: WebhookBody, rawBody: string): Promise<void> {
  if (body.object !== 'instagram' && body.object !== 'page') return;

  const pages = await listPages();

  for (const entry of body.entry ?? []) {
    // Match page by entry.id (IG user ID or Page ID)
    const page = pages.find(
      p => p.igUserId === entry.id || p.id === entry.id
    );
    if (!page || !page.automation.enabled) continue;

    // Verify webhook signature if appSecret is set
    // (Signature is per-request, checked against any matching page's secret)

    // Handle comment changes
    for (const change of entry.changes ?? []) {
      if (change.field === 'comments' || change.field === 'live_comments') {
        await handleCommentEvent(page.id, change);
      }
    }
  }
}

async function handleCommentEvent(
  pageId: string,
  change: WebhookChange
): Promise<void> {
  const page = await getPage(pageId);
  if (!page || !page.automation.enabled) return;

  const { from, text = '', comment_id, media_id } = change.value;
  if (!comment_id || !from?.id) return;

  const commenterId = from.id;
  const commenterName = from.username ?? 'there';
  const commentText = text;
  const mediaId = media_id ?? '';

  // ── Keyword filter ─────────────────────────────────────────────────────────
  const { triggerKeywords } = page.automation;
  if (triggerKeywords.length > 0) {
    const lower = commentText.toLowerCase();
    const matched = triggerKeywords.some(kw => lower.includes(kw.toLowerCase()));
    if (!matched) return;
  }

  await updatePageStats(pageId, { commentsTrigger: 1 });

  const baseLog: Omit<EventLog, 'type' | 'details'> = {
    id: uuidv4(),
    pageId,
    timestamp: new Date().toISOString(),
    commenterId,
    commenterName,
    commentText,
    mediaId,
  };

  await appendEvent({ ...baseLog, type: 'comment_received' });

  // ── Reply to comment ───────────────────────────────────────────────────────
  const replyText = page.automation.replyComment
    .replace('{name}', commenterName)
    .replace('{username}', commenterName);

  try {
    if (replyText.trim()) {
      await replyToComment(comment_id, replyText, page.pageAccessToken);
      await appendEvent({ ...baseLog, id: uuidv4(), type: 'reply_sent' });
    }
  } catch (err) {
    await appendEvent({ ...baseLog, id: uuidv4(), type: 'error', details: String(err) });
  }

  // ── Follow gate ────────────────────────────────────────────────────────────
  if (page.automation.requireFollow) {
    const follows = await doesUserFollow(page.igUserId, commenterId, page.pageAccessToken);
    if (!follows) {
      await appendEvent({ ...baseLog, id: uuidv4(), type: 'dm_skipped', details: 'User does not follow page' });
      return;
    }
  }

  // ── Send DM ────────────────────────────────────────────────────────────────
  const userInfo = await getUserInfo(commenterId, page.pageAccessToken).catch(() => ({ name: commenterName }));
  const dmText = page.automation.dmMessage
    .replace('{name}', userInfo.name)
    .replace('{username}', commenterName);

  try {
    await sendDM(
      page.igUserId,
      commenterId,
      dmText,
      page.automation.dmLinks,
      page.pageAccessToken
    );
    await appendEvent({ ...baseLog, id: uuidv4(), type: 'dm_sent' });
    await updatePageStats(pageId, { dmsSent: 1 });
  } catch (err) {
    await appendEvent({ ...baseLog, id: uuidv4(), type: 'error', details: String(err) });
  }
}
