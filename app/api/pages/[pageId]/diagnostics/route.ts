// app/api/pages/[pageId]/diagnostics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPage } from '@/lib/store';

const REQUIRED_PERMISSIONS = [
  { key: 'instagram_manage_messages', name: 'Send Instagram DMs / Private Replies', critical: true },
  { key: 'instagram_manage_comments', name: 'Read & Reply to Instagram Comments', critical: true },
  { key: 'pages_manage_metadata', name: 'Subscribe Page to Webhooks', critical: true },
  { key: 'pages_read_engagement', name: 'Read Page Engagement', critical: false },
  { key: 'instagram_basic', name: 'Basic Instagram Profile & Media Access', critical: true },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const token = page.pageAccessToken;

    // 1. Check Permissions
    let grantedPermissions: string[] = [];
    let tokenDebug: any = null;
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`);
      const json = await res.json();
      if (json.data) {
        grantedPermissions = json.data
          .filter((p: any) => p.status === 'granted')
          .map((p: any) => p.permission);
      } else if (json.error) {
        tokenDebug = json.error;
      }
    } catch (e: any) {
      tokenDebug = e.message;
    }

    const permissionStatus = REQUIRED_PERMISSIONS.map(p => ({
      ...p,
      granted: grantedPermissions.includes(p.key),
    }));

    const missingCritical = permissionStatus.filter(p => p.critical && !p.granted);

    // 2. Check Subscribed Apps
    let subscribed = false;
    let subscribedFields: string[] = [];
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=${token}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        subscribed = true;
        subscribedFields = json.data[0]?.subscribed_fields || [];
      }
    } catch {}

    // 3. Check Page details
    let meInfo: any = null;
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,instagram_business_account&access_token=${token}`);
      meInfo = await res.json();
    } catch {}

    return NextResponse.json({
      pageId: page.id,
      pageName: page.name,
      igUserId: page.igUserId,
      tokenError: tokenDebug,
      permissions: permissionStatus,
      missingCriticalCount: missingCritical.length,
      allCriticalGranted: missingCritical.length === 0,
      subscribedToWebhooks: subscribed,
      subscribedFields,
      meInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

// POST: Trigger /subscribed_apps registration
export async function POST(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const token = page.pageAccessToken;

    const res = await fetch(`https://graph.facebook.com/v18.0/me/subscribed_apps?subscribed_fields=feed,messages,messaging_postbacks,comments&access_token=${token}`, {
      method: 'POST',
    });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ success: false, error: json.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, result: json });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
