// lib/instagram.ts
// Instagram Graph API client

const BASE = 'https://graph.facebook.com/v18.0';

interface GraphResponse<T> {
  data?: T;
  error?: { message: string; code: number };
}

async function graphRequest<T>(
  path: string,
  params: Record<string, string>,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as GraphResponse<T>;
  if (json.error) throw new Error(`Instagram API: ${json.error.message} (${json.error.code})`);
  return (json as unknown) as T;
}

// ─── Comment Reply ────────────────────────────────────────────────────────────

export async function replyToComment(
  commentId: string,
  message: string,
  accessToken: string
): Promise<void> {
  await graphRequest(
    `/${commentId}/replies`,
    { access_token: accessToken },
    'POST',
    { message }
  );
}

// ─── Send DM ──────────────────────────────────────────────────────────────────

export async function sendDM(
  igUserId: string,         // page's IG user ID
  recipientIgId: string,   // commenter's IG scoped user ID
  message: string,
  links: { label: string; url: string }[],
  accessToken: string
): Promise<void> {
  // Build message with links appended
  let fullMessage = message;
  if (links.length > 0) {
    fullMessage += '\n\n';
    links.forEach(l => {
      fullMessage += `🔗 ${l.label}: ${l.url}\n`;
    });
  }

  await graphRequest(
    `/${igUserId}/messages`,
    { access_token: accessToken },
    'POST',
    {
      recipient: { id: recipientIgId },
      message: { text: fullMessage },
    }
  );
}

// ─── Check Follow Status ──────────────────────────────────────────────────────

export async function doesUserFollow(
  igUserId: string,       // page's IG user ID
  userId: string,         // commenter's IG user ID
  accessToken: string
): Promise<boolean> {
  try {
    // Check if the user is in our follower list using /{ig-user-id}/followers
    // This requires instagram_manage_insights permission
    const res = await graphRequest<{ data: { id: string }[] }>(
      `/${igUserId}/followers`,
      { access_token: accessToken, fields: 'id', limit: '1', filter: `{"id": "${userId}"}` }
    );
    return Array.isArray(res.data) && res.data.length > 0;
  } catch {
    // If we can't check, default to allowing
    return true;
  }
}

// ─── Get Page Info ────────────────────────────────────────────────────────────

export async function getPageInfo(
  accessToken: string
): Promise<{ id: string; name: string; igUserId: string }> {
  // Get Facebook Page ID + name
  const page = await graphRequest<{ id: string; name: string; instagram_business_account: { id: string } }>(
    '/me',
    { access_token: accessToken, fields: 'id,name,instagram_business_account' }
  );

  return {
    id: page.id,
    name: page.name,
    igUserId: page.instagram_business_account?.id ?? '',
  };
}

// ─── Get User Info ────────────────────────────────────────────────────────────

export async function getUserInfo(
  userId: string,
  accessToken: string
): Promise<{ name: string }> {
  try {
    const user = await graphRequest<{ name: string }>(
      `/${userId}`,
      { access_token: accessToken, fields: 'name' }
    );
    return user;
  } catch {
    return { name: 'there' };
  }
}

// ─── Verify Webhook Signature ─────────────────────────────────────────────────

export function verifyWebhookSignature(
  body: string,
  signature: string,
  appSecret: string
): boolean {
  const crypto = require('crypto');
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(body).digest('hex')}`;
  return signature === expected;
}
