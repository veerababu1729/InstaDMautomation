// app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listPages, savePage } from '@/lib/store';
import { getPageInfo } from '@/lib/instagram';
import { PageConfig } from '@/lib/types';
import { randomBytes } from 'crypto';

// GET /api/pages — list all pages
export async function GET() {
  try {
    const pages = await listPages();
    // Strip access tokens from response
    const safe = pages.map(p => ({ ...p, pageAccessToken: '***', appSecret: '***' }));
    return NextResponse.json(safe);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/pages — create a new page
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageAccessToken, appSecret, igUserId, customName } = body;

    if (!pageAccessToken || !appSecret) {
      return NextResponse.json({ error: 'pageAccessToken and appSecret are required' }, { status: 400 });
    }

    let resolvedName = customName || '';
    let resolvedIgUserId = igUserId || '';

    // Auto-fetch page info if not provided
    if (!resolvedIgUserId || !resolvedName) {
      try {
        const info = await getPageInfo(pageAccessToken);
        resolvedIgUserId = resolvedIgUserId || info.igUserId;
        resolvedName = resolvedName || info.name;
      } catch (e) {
        if (!resolvedIgUserId) {
          return NextResponse.json({ error: 'Could not fetch page info. Provide igUserId manually.' }, { status: 400 });
        }
      }
    }

    const id = resolvedIgUserId || randomBytes(8).toString('hex');
    const webhookVerifyToken = randomBytes(16).toString('hex');

    const page: PageConfig = {
      id,
      name: resolvedName || `Page ${id.slice(0, 8)}`,
      igUserId: resolvedIgUserId,
      pageAccessToken,
      appSecret,
      webhookVerifyToken,
      automation: {
        enabled: false,
        triggerKeywords: [],
        triggerMediaUrl: '',
        replyComment: 'Hey {name}! Check your DMs 📩',
        dmMessage: 'Hey {name}! Thanks for your comment 🙌\nHere are the links you requested:',
        dmLinks: [],
        requireFollow: false,
        mediaFilter: 'all',
      },
      createdAt: new Date().toISOString(),
      stats: {
        totalDmsSent: 0,
        totalCommentsTrigger: 0,
        lastActivity: null,
      },
    };

    await savePage(page);

    // Return full page config (including tokens) — only on creation
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
