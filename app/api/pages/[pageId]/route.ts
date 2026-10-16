// app/api/pages/[pageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPage, savePage, deletePage, getEvents } from '@/lib/store';
import { PageConfig, AutomationRule } from '@/lib/types';
import { randomBytes } from 'crypto';

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

// PATCH /api/pages/:pageId — update page name, credentials, or automations array
export async function PATCH(req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    const page = await getPage(params.pageId);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates = await req.json();

    // Allow credential / name updates
    if (updates.pageAccessToken) page.pageAccessToken = updates.pageAccessToken;
    if (updates.appSecret) page.appSecret = updates.appSecret;
    if (updates.name) page.name = updates.name;

    // Replace automations array wholesale if provided
    if (Array.isArray(updates.automations)) {
      page.automations = updates.automations as AutomationRule[];
    }

    // Upsert a single automation rule by id
    if (updates.upsertAutomation) {
      const incoming = updates.upsertAutomation as AutomationRule;
      const idx = page.automations.findIndex(a => a.id === incoming.id);
      if (idx >= 0) {
        page.automations[idx] = { ...page.automations[idx], ...incoming };
      } else {
        // New rule — assign fresh id if missing
        if (!incoming.id) incoming.id = randomBytes(8).toString('hex');
        page.automations.push(incoming);
      }
    }

    // Delete a single automation rule
    if (updates.deleteAutomationId) {
      page.automations = page.automations.filter(a => a.id !== updates.deleteAutomationId);
    }

    // Legacy single-automation support for backward compat
    if (updates.automation) {
      if (page.automations.length > 0) {
        // Apply to first rule
        page.automations[0] = { ...page.automations[0], ...updates.automation };
      }
    }

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
