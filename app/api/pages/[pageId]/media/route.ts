// app/api/pages/[pageId]/media/route.ts
// Fetches the IG Business Account's recent posts + reels via Graph API

import { NextRequest, NextResponse } from 'next/server';
import { getPage } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { igUserId, pageAccessToken } = page;

    // Fetch up to 20 recent media items
    const url = new URL(`https://graph.facebook.com/v18.0/${igUserId}/media`);
    url.searchParams.set('fields', 'id,media_type,thumbnail_url,media_url,permalink,caption,timestamp');
    url.searchParams.set('limit', '20');
    url.searchParams.set('access_token', pageAccessToken);

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: json.data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
