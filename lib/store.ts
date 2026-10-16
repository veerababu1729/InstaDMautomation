import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { PageConfig, AutomationRule, EventLog } from './types';

// ─── Local file persistence for dev ───────────────────────────────────────────
const STORE_PATH = path.join(process.cwd(), '.local_store.json');

const globalForStore = globalThis as unknown as {
  _kv?: Map<string, string>;
  _kvLoaded?: boolean;
};

const _kv: Map<string, string> = globalForStore._kv ?? new Map();
globalForStore._kv = _kv;

function loadFromFile() {
  if (globalForStore._kvLoaded) return;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      if (content.trim()) {
        const data = JSON.parse(content);
        for (const [k, v] of Object.entries(data)) {
          _kv.set(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    }
  } catch (err) {
    console.error('[Store] Error reading local store file:', err);
  }
  globalForStore._kvLoaded = true;
}

function saveToFile() {
  try {
    const obj: Record<string, string> = {};
    _kv.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Error writing local store file:', err);
  }
}

// ─── KV abstraction ────────────────────────────────────────────────────────────
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
  loadFromFile();
  return _kv.get(key) ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, value);
  } else {
    loadFromFile();
    _kv.set(key, value);
    saveToFile();
  }
}

async function kvDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(key);
  } else {
    loadFromFile();
    _kv.delete(key);
    saveToFile();
  }
}

// ─── Migration: legacy single automation → automations[] ─────────────────────

export function migratePageLegacy(page: PageConfig): PageConfig {
  if (page.automations && !page.automation) return page;

  const legacy = page.automation;
  if (legacy) {
    const rule: AutomationRule = {
      id: randomBytes(8).toString('hex'),
      name: 'Default Automation',
      enabled: legacy.enabled ?? false,
      triggerKeywords: legacy.triggerKeywords ?? [],
      triggerMediaUrl: legacy.triggerMediaUrl ?? '',
      targetMediaId: legacy.targetMediaId ?? '',
      mediaFilter: legacy.mediaFilter ?? 'all',
      replyComment: legacy.replyComment ?? 'Hey {name}! Check your DMs 📩',
      dmMessage: legacy.dmMessage ?? 'Hey {name}! Here are the links you requested:',
      dmLinks: legacy.dmLinks ?? [],
      requireFollow: legacy.requireFollow ?? false,
      stats: { totalDmsSent: 0, totalCommentsTrigger: 0, lastActivity: null },
      createdAt: page.createdAt,
    };
    const migrated = { ...page, automations: [rule] };
    delete (migrated as Record<string, unknown>).automation;
    return migrated;
  }
  if (!page.automations) {
    return { ...page, automations: [] };
  }
  return page;
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
  const page = JSON.parse(raw) as PageConfig;
  return migratePageLegacy(page);
}

export async function savePage(page: PageConfig): Promise<void> {
  await kvSet(`pages:${page.id}`, JSON.stringify(page));
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

export async function updateAutomationStats(
  pageId: string,
  automationId: string,
  delta: { dmsSent?: number; commentsTrigger?: number }
): Promise<void> {
  const page = await getPage(pageId);
  if (!page) return;
  const rule = page.automations.find(a => a.id === automationId);
  if (rule) {
    if (delta.dmsSent) rule.stats.totalDmsSent += delta.dmsSent;
    if (delta.commentsTrigger) rule.stats.totalCommentsTrigger += delta.commentsTrigger;
    rule.stats.lastActivity = new Date().toISOString();
  }
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
  events.unshift(event);
  await kvSet(key, JSON.stringify(events.slice(0, 100)));
}

export async function getEvents(pageId: string): Promise<EventLog[]> {
  const raw = await kvGet(`events:${pageId}`);
  if (!raw) return [];
  return JSON.parse(raw) as EventLog[];
}
