// lib/store.ts
// Upstash Redis-backed data layer. Falls back to in-memory store for local dev.
// Vercel KV migrated to Upstash Redis — use @upstash/redis + KV_REST_API_URL / KV_REST_API_TOKEN
import { PageConfig, EventLog } from './types';

// ─── KV abstraction ────────────────────────────────────────────────────────────
const _kv: Map<string, string> = new Map();

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  }
  return null;
}

async function kvGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  if (redis) {
    const val = await redis.get<string>(key);
    return val ?? null;
  }
  return _kv.get(key) ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, value);
  } else {
    _kv.set(key, value);
  }
}

async function kvDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(key);
  } else {
    _kv.delete(key);
  }
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function listPages(): Promise<PageConfig[]> {
  const raw = await kvGet('pages:list');
  if (!raw) return [];
  const ids: string[] = JSON.parse(raw);
  const pages = await Promise.all(ids.map(id => getPage(id)));
  return pages.filter(Boolean) as PageConfig[];
}

export async function getPage(id: string): Promise<PageConfig | null> {
  const raw = await kvGet(`pages:${id}`);
  if (!raw) return null;
  return JSON.parse(raw) as PageConfig;
}

export async function savePage(page: PageConfig): Promise<void> {
  await kvSet(`pages:${page.id}`, JSON.stringify(page));
  // Update index
  const raw = await kvGet('pages:list');
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(page.id)) {
    ids.push(page.id);
    await kvSet('pages:list', JSON.stringify(ids));
  }
}

export async function deletePage(id: string): Promise<void> {
  await kvDel(`pages:${id}`);
  const raw = await kvGet('pages:list');
  if (!raw) return;
  const ids: string[] = JSON.parse(raw);
  await kvSet('pages:list', JSON.stringify(ids.filter(i => i !== id)));
}

export async function updatePageStats(
  id: string,
  delta: { dmsSent?: number; commentsTrigger?: number }
): Promise<void> {
  const page = await getPage(id);
  if (!page) return;
  if (delta.dmsSent) page.stats.totalDmsSent += delta.dmsSent;
  if (delta.commentsTrigger) page.stats.totalCommentsTrigger += delta.commentsTrigger;
  page.stats.lastActivity = new Date().toISOString();
  await savePage(page);
}

// ─── Event Logs ───────────────────────────────────────────────────────────────

export async function appendEvent(event: EventLog): Promise<void> {
  const key = `events:${event.pageId}`;
  const raw = await kvGet(key);
  const events: EventLog[] = raw ? JSON.parse(raw) : [];
  events.unshift(event); // newest first
  await kvSet(key, JSON.stringify(events.slice(0, 100))); // keep last 100
}

export async function getEvents(pageId: string): Promise<EventLog[]> {
  const raw = await kvGet(`events:${pageId}`);
  if (!raw) return [];
  return JSON.parse(raw) as EventLog[];
}
