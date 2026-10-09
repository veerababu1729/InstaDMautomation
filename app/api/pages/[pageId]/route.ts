// app/api/pages/[pageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPage, savePage, deletePage, getEvents } from '@/lib/store';
import { PageConfig } from '@/lib/types';

// GET /api/pages/:pageId
export async function GET(_req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const events = await getEvents(params.pageId);
    return NextResponse.json({ ...page, pageAccessToken: '***', appSecret: '***', events });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/pages/:pageId — update automation config or credentials
export async function PATCH(req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates = await req.json();

    // Merge automation updates deeply
    if (updates.automation) {
      page.automation = { ...page.automation, ...updates.automation };
    }

    // Allow credential updates
    if (updates.pageAccessToken) page.pageAccessToken = updates.pageAccessToken;
    if (updates.appSecret) page.appSecret = updates.appSecret;
    if (updates.name) page.name = updates.name;

    await savePage(page);
    return NextResponse.json({ ...page, pageAccessToken: '***', appSecret: '***' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/pages/:pageId
export async function DELETE(_req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    await deletePage(params.pageId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
