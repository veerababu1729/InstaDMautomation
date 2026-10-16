// app/api/webhook/route.ts
// Meta Webhook endpoint: verify (GET) + receive comment events (POST)

import { NextRequest, NextResponse } from 'next/server';
import { listPages } from '@/lib/store';
import { processEntries } from '@/lib/webhook-processor';

// ─── GET: Webhook Verification ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log(`[Webhook GET] mode=${mode}, token=${token}, challenge=${challenge ? 'present' : 'missing'}`);

  if (mode !== 'subscribe') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Check token against all pages
  const pages = await listPages();
  const matchedPage = pages.find(p => p.webhookVerifyToken === token);

  // In local dev, accept the verification challenge for any token if matched or dev fallback
  if (!matchedPage) {
    if (process.env.NODE_ENV !== 'production' || process.env.WEBHOOK_VERIFY_TOKEN === token) {
      console.log(`[Webhook] Accepting verification challenge in dev/fallback for token: ${token}`);
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ─── POST: Receive Events ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: any;

  try {
    body = JSON.parse(bodyText);
  } catch {
    console.error('[Webhook POST] Invalid JSON received:', bodyText);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[Webhook POST] Incoming payload:\n', JSON.stringify(body, null, 2));

  try {
    await processEntries(body);
  } catch (err) {
    console.error('[Webhook POST] Error processing webhook event:', err);
  }

  return NextResponse.json({ received: true });
}
