// app/api/test-comment/route.ts
// Test endpoint: Simulate an incoming comment event without waiting for Instagram
import { NextRequest, NextResponse } from 'next/server';
import { getPage, getEvents } from '@/lib/store';
import { processEntries } from '@/lib/webhook-processor';

export async function POST(req: NextRequest) {
  try {
    const { pageId, commentText, mediaId, commenterUsername } = await req.json();

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const page = await getPage(pageId);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const targetMedia = mediaId || (page.automations.find(a => a.targetMediaId)?.targetMediaId || '18190937410396753');
    const commentId = `test_comment_${Date.now()}`;
    const username = commenterUsername || 'test_user';

    const mockPayload = {
      object: 'instagram',
      entry: [
        {
          id: page.igUserId || page.id,
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'comments',
              value: {
                id: commentId,
                text: commentText || 'erra',
                from: {
                  id: '999999999999999',
                  username: username,
                },
                media: {
                  id: targetMedia,
                  media_product_type: 'REELS',
                },
              },
            },
          ],
        },
      ],
    };

    console.log('[Test-Comment] Simulating webhook with payload:', JSON.stringify(mockPayload, null, 2));

    await processEntries(mockPayload);

    // Fetch latest events for this page to see the result
    const recentEvents = (await getEvents(pageId)).slice(0, 5);

    return NextResponse.json({
      success: true,
      message: `Simulated comment "${commentText || 'erra'}" on media ${targetMedia}`,
      recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
