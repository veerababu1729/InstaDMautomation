// app/api/test-dm/route.ts
// Manually trigger a test DM to yourself
import { NextRequest, NextResponse } from 'next/server';
import { getPage } from '@/lib/store';
import { sendDM } from '@/lib/instagram';

export async function POST(req: NextRequest) {
  try {
    const { pageId, recipientIgId } = await req.json();
    if (!pageId || !recipientIgId) {
      return NextResponse.json({ error: 'pageId and recipientIgId required' }, { status: 400 });
    }

    const page = await getPage(pageId);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    // Use first automation rule; fall back gracefully if none exist
    const rule = page.automations[0];
    const dmMessage = rule
      ? rule.dmMessage.replace('{name}', 'You').replace('{username}', 'You')
      : 'This is a test DM.';
    const dmLinks = rule?.dmLinks ?? [];

    await sendDM(
      page.igUserId,
      recipientIgId,
      `🧪 Test DM from ${page.name}\n${dmMessage}`,
      dmLinks,
      page.pageAccessToken
    );

    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
