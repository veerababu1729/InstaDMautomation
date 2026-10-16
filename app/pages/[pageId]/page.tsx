'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageConfig, AutomationRule, EventLog, IGMedia } from '@/lib/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  comment_received: '💬',
  reply_sent: '↩️',
  dm_sent: '📩',
  dm_skipped: '⏭️',
  error: '❌',
};

const EVENT_LABELS: Record<string, string> = {
  comment_received: 'Comment Received',
  reply_sent: 'Comment Reply Sent',
  dm_sent: 'DM Sent',
  dm_skipped: 'DM Skipped',
  error: 'Error',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

function extractMediaIdFromUrl(url: string): string {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (!match) return '';
  const shortcode = match[2];
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = BigInt(0);
  for (const char of shortcode) {
    const idx = CHARS.indexOf(char);
    if (idx === -1) return '';
    id = id * BigInt(64) + BigInt(idx);
  }
  return id.toString();
}

const DEFAULT_RULE = (): Omit<AutomationRule, 'id' | 'createdAt'> => ({
  name: 'New Automation',
  enabled: false,
  triggerKeywords: [],
  triggerMediaUrl: '',
  targetMediaId: '',
  mediaFilter: 'all',
  replyComment: 'Hey {name}! Check your DMs 📩',
  dmMessage: 'Hey {name}! Thanks for your comment 🙌\nHere are the links you requested:',
  dmLinks: [],
  requireFollow: false,
  stats: { totalDmsSent: 0, totalCommentsTrigger: 0, lastActivity: null },
});

type Section = 'overview' | 'webhook' | 'events' | 'test';

// ─── main component ──────────────────────────────────────────────────────────

export default function PageConfigScreen() {
  const { pageId } = useParams<{ pageId: string }>();
  const router = useRouter();
  const [page, setPage] = useState<PageConfig | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [section, setSection] = useState<Section>('overview');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deployedUrl, setDeployedUrl] = useState('');

  // Automation editor modal
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setPage(data);
      setEvents(data.events ?? []);
    } catch { router.push('/'); }
  }, [pageId, router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setDeployedUrl(window.location.origin); }, []);

  // ── Automation CRUD helpers ────────────────────────────────────────────────

  const upsertRule = async (rule: AutomationRule) => {
    if (!page) return;
    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsertAutomation: rule }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Save failed', 'error'); return; }
    setPage({ ...page, ...data });
    showToast('Automation saved!');
    setEditingRule(null);
  };

  const deleteRule = async (ruleId: string) => {
    if (!page || !confirm('Delete this automation? This cannot be undone.')) return;
    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteAutomationId: ruleId }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Delete failed', 'error'); return; }
    setPage({ ...page, ...data });
    showToast('Automation deleted');
  };

  const toggleRule = async (rule: AutomationRule) => {
    if (!page) return;
    const updated = { ...rule, enabled: !rule.enabled };
    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsertAutomation: updated }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Toggle failed', 'error'); return; }
    setPage({ ...page, ...data });
  };

  const openNewRule = () => {
    const now = new Date().toISOString();
    setEditingRule({
      id: '',         // will be assigned server-side
      createdAt: now,
      ...DEFAULT_RULE(),
    });
    setIsNewRule(true);
  };

  const openEditRule = (rule: AutomationRule) => {
    setEditingRule({ ...rule });
    setIsNewRule(false);
  };

  const deletePage = async () => {
    if (!confirm(`Delete "${page?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
    router.push('/');
  };

  if (!page) {
    return (
      <div className="container" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  const SIDEBAR_ITEMS: { id: Section; label: string; icon: string }[] = [
    { id: 'overview', label: 'Automations', icon: '⚡' },
    { id: 'webhook', label: 'Webhook Setup', icon: '🌐' },
    { id: 'events', label: `Activity Log (${events.length})`, icon: '📋' },
    { id: 'test', label: 'Test & Debug', icon: '🧪' },
  ];

  const totalDMs = page.automations.reduce((s, a) => s + a.stats.totalDmsSent, 0);
  const totalComments = page.automations.reduce((s, a) => s + a.stats.totalCommentsTrigger, 0);
  const activeCount = page.automations.filter(a => a.enabled).length;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>← Dashboard</button>
        <div className="page-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
          {page.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 style={{ fontSize: 22 }}>{page.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {page.igUserId || page.id}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {activeCount > 0 ? `${activeCount} active` : 'No active automations'}
          </span>
          <button className="btn btn-primary" onClick={openNewRule}>
            ➕ New Automation
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">⚡ Active Rules</div>
          <div className="stat-value">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💬 Comments Triggered</div>
          <div className="stat-value">{totalComments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📩 DMs Sent</div>
          <div className="stat-value">{totalDMs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📈 DM Rate</div>
          <div className="stat-value">
            {totalComments > 0 ? Math.round((totalDMs / totalComments) * 100) + '%' : '—'}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="config-layout">
        {/* Sidebar */}
        <div className="config-sidebar">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${section === item.id ? 'active' : ''}`}
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setSection(item.id)}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-divider" />
          <button
            className="sidebar-item"
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--accent-red)' }}
            onClick={deletePage}
            disabled={deleting}
          >
            <span>🗑️</span>
            <span>{deleting ? 'Deleting...' : 'Delete Page'}</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── AUTOMATIONS OVERVIEW ── */}
          {section === 'overview' && (
            <>
              {page.automations.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">⚡</div>
                    <h3>No automations yet</h3>
                    <p>Create your first automation rule to start sending DMs when people comment on your posts or reels.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNewRule}>
                      ➕ Create First Automation
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {page.automations.map(rule => (
                    <AutomationCard
                      key={rule.id}
                      rule={rule}
                      onEdit={() => openEditRule(rule)}
                      onDelete={() => deleteRule(rule.id)}
                      onToggle={() => toggleRule(rule)}
                    />
                  ))}
                  <button
                    className="btn btn-ghost"
                    style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}
                    onClick={openNewRule}
                  >
                    ➕ Add Another Automation
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── WEBHOOK ── */}
          {section === 'webhook' && (
            <WebhookSection page={page} deployedUrl={deployedUrl} pageId={pageId} showToast={showToast} reloadPage={load} />
          )}

          {/* ── EVENTS ── */}
          {section === 'events' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📋 Activity Log</div>
                <button className="btn btn-sm btn-ghost" onClick={load}>🔄 Refresh</button>
              </div>
              {events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No activity yet</h3>
                  <p>Events will appear here once someone comments on your content.</p>
                </div>
              ) : (
                <div className="event-list">
                  {events.map(e => (
                    <div key={e.id} className="event-item">
                      <div className={`event-icon ${e.type}`}>{EVENT_ICONS[e.type]}</div>
                      <div className="event-body">
                        <div className="event-title">{EVENT_LABELS[e.type]} — @{e.commenterName}</div>
                        <div className="event-detail">"{e.commentText}"</div>
                        {e.details && <div className="event-detail" style={{ color: 'var(--accent-red)', marginTop: 2 }}>{e.details}</div>}
                      </div>
                      <div className="event-time">{timeAgo(e.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TEST ── */}
          {section === 'test' && (
            <TestSection page={page} pageId={pageId} showToast={showToast} />
          )}

        </div>
      </div>

      {/* Automation Editor Modal */}
      {editingRule && (
        <AutomationModal
          rule={editingRule}
          isNew={isNewRule}
          pageId={pageId}
          onSave={upsertRule}
          onClose={() => setEditingRule(null)}
        />
      )}
    </div>
  );
}

// ─── Automation Card ─────────────────────────────────────────────────────────

function AutomationCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: AutomationRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const dmRate = rule.stats.totalCommentsTrigger > 0
    ? Math.round((rule.stats.totalDmsSent / rule.stats.totalCommentsTrigger) * 100) + '%'
    : '—';

  return (
    <div className="card" style={{ borderLeft: `3px solid ${rule.enabled ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        {/* Toggle */}
        <label className="toggle" style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer' }}>
          <input type="checkbox" checked={rule.enabled} onChange={onToggle} />
          <div className="toggle-track" />
          <div className="toggle-thumb" />
        </label>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{rule.name}</span>
            <span className={`badge ${rule.enabled ? 'badge-active' : 'badge-inactive'}`}>
              {rule.enabled ? '● Active' : '○ Paused'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: 12 }}>
            <span>
              🔑 {rule.triggerKeywords.length > 0
                ? rule.triggerKeywords.join(', ')
                : <em>All comments</em>}
            </span>
            <span>
              🎬 {rule.targetMediaId
                ? (rule.triggerMediaUrl
                  ? <a href={rule.triggerMediaUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)' }}>Specific post</a>
                  : 'Specific post')
                : 'All posts & reels'}
            </span>
            <span>📩 {rule.dmLinks.length} link(s)</span>
          </div>

          {/* Per-rule mini stats */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              💬 <strong>{rule.stats.totalCommentsTrigger}</strong> triggered
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              📩 <strong>{rule.stats.totalDmsSent}</strong> sent
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              📈 <strong>{dmRate}</strong> rate
            </span>
            {rule.stats.lastActivity && (
              <span style={{ color: 'var(--text-muted)' }}>
                Last: {timeAgo(rule.stats.lastActivity)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-sm btn-ghost" onClick={onEdit}>✏️ Edit</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ─── Automation Modal ─────────────────────────────────────────────────────────

function AutomationModal({
  rule,
  isNew,
  pageId,
  onSave,
  onClose,
}: {
  rule: AutomationRule;
  isNew: boolean;
  pageId: string;
  onSave: (r: AutomationRule) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AutomationRule>({ ...rule });
  const [tab, setTab] = useState<'trigger' | 'message' | 'links'>('trigger');
  const [keywords, setKeywords] = useState(rule.triggerKeywords.join(', '));
  const [links, setLinks] = useState(rule.dmLinks.length > 0 ? rule.dmLinks : [{ label: '', url: '' }]);
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const set = <K extends keyof AutomationRule>(k: K, v: AutomationRule[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const handleUrlChange = (url: string) => {
    set('triggerMediaUrl', url);
    const resolved = extractMediaIdFromUrl(url);
    set('targetMediaId', resolved);
  };

  const fetchMedia = async () => {
    setLoadingMedia(true);
    setMediaError('');
    try {
      const res = await fetch(`/api/pages/${pageId}/media`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load media');
      setMedia(json.data ?? []);
      setShowPicker(true);
    } catch (e) {
      setMediaError((e as Error).message);
    }
    setLoadingMedia(false);
  };

  const pickMedia = (item: IGMedia) => {
    set('triggerMediaUrl', item.permalink);
    set('targetMediaId', item.id);
    setShowPicker(false);
  };

  const handleSave = () => {
    onSave({
      ...draft,
      triggerKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      dmLinks: links.filter(l => l.label && l.url),
    });
  };

  const TABS = [
    { id: 'trigger' as const, label: '⚡ Trigger' },
    { id: 'message' as const, label: '💬 Messages' },
    { id: 'links' as const, label: '🔗 Links' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 999, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(700px, 96vw)', maxHeight: '90vh',
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16,
          marginBottom: 0,
        }}>
          <div style={{ flex: 1 }}>
            <input
              className="input"
              style={{ fontWeight: 600, fontSize: 16 }}
              value={draft.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Automation name (e.g. Reel #1 - Summer Drop)"
            />
          </div>
          <label className="toggle" style={{ cursor: 'pointer', flexShrink: 0 }}>
            <input type="checkbox" checked={draft.enabled} onChange={e => set('enabled', e.target.checked)} />
            <div className="toggle-track" />
            <div className="toggle-thumb" />
          </label>
          <span style={{ fontSize: 12, color: draft.enabled ? 'var(--accent-green, #4ade80)' : 'var(--text-muted)' }}>
            {draft.enabled ? 'Active' : 'Paused'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: tab === t.id ? 'var(--gradient-brand)' : 'rgba(255,255,255,0.05)',
                color: tab === t.id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── TRIGGER tab ── */}
          {tab === 'trigger' && (
            <>
              <div className="form-group">
                <label className="form-label">🔑 Trigger Keywords</label>
                <input
                  className="input"
                  placeholder="link, dm me, send it  — comma separated — or leave empty for ALL comments"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
                <div className="form-hint">Leave empty to trigger on every comment. Case-insensitive "contains" match.</div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8 }}>
                  🎬 Target Post / Reel
                </label>

                {/* Selected media preview */}
                {draft.targetMediaId && (
                  <div style={{
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Media ID: {draft.targetMediaId}</div>
                      {draft.triggerMediaUrl && (
                        <a href={draft.triggerMediaUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none' }}>
                          {draft.triggerMediaUrl}
                        </a>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => { set('targetMediaId', ''); set('triggerMediaUrl', ''); }}
                    >✕ Clear</button>
                  </div>
                )}

                {/* Picker button */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={fetchMedia}
                    disabled={loadingMedia}
                    style={{ flex: 1 }}
                  >
                    {loadingMedia ? <><div className="spinner" />Loading...</> : '📷 Pick from Your Posts & Reels'}
                  </button>
                  {!draft.targetMediaId && (
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      or paste URL ↓
                    </span>
                  )}
                </div>

                {mediaError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 10 }}>
                    ❌ {mediaError} — Try pasting the URL manually instead.
                  </div>
                )}

                <input
                  className="input"
                  placeholder="https://www.instagram.com/reel/... (optional manual paste)"
                  value={draft.triggerMediaUrl ?? ''}
                  onChange={e => handleUrlChange(e.target.value)}
                />
                {!draft.targetMediaId && (
                  <div className="form-hint">Leave empty to trigger on ALL posts & reels.</div>
                )}
              </div>

              {/* Media picker gallery */}
              {showPicker && media.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                    Select a post or reel:
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 10, maxHeight: 320, overflowY: 'auto',
                  }}>
                    {media.map(item => (
                      <MediaThumbnail key={item.id} item={item} onPick={() => pickMedia(item)} selected={draft.targetMediaId === item.id} />
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setShowPicker(false)}>
                    ✕ Close Picker
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">📹 Media Filter</label>
                <select className="select" value={draft.mediaFilter} onChange={e => set('mediaFilter', e.target.value as AutomationRule['mediaFilter'])}>
                  <option value="all">All posts & reels</option>
                  <option value="reels">Reels only</option>
                  <option value="posts">Posts only</option>
                </select>
              </div>

              <label className="toggle-wrapper" style={{ cursor: 'pointer' }}>
                <label className="toggle">
                  <input type="checkbox" checked={draft.requireFollow} onChange={e => set('requireFollow', e.target.checked)} />
                  <div className="toggle-track" />
                  <div className="toggle-thumb" />
                </label>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Require user to follow your page</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skip DM if commenter doesn&apos;t follow. Needs instagram_manage_insights.</div>
                </div>
              </label>
            </>
          )}

          {/* ── MESSAGES tab ── */}
          {tab === 'message' && (
            <>
              <div className="form-group">
                <label className="form-label">↩️ Public Comment Reply</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={draft.replyComment}
                  onChange={e => set('replyComment', e.target.value)}
                  placeholder="Hey {name}! Check your DMs 📩"
                />
                <div className="form-hint">Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>{'{name}'}</code> as a placeholder. Leave empty to skip public reply.</div>
              </div>

              <div className="form-group">
                <label className="form-label">📩 DM Message Body</label>
                <textarea
                  className="textarea"
                  rows={5}
                  value={draft.dmMessage}
                  onChange={e => set('dmMessage', e.target.value)}
                  placeholder="Hey {name}! Here are the links you asked for 👇"
                />
              </div>

              {/* DM Preview */}
              <div>
                <div className="section-title">👁️ Live Preview</div>
                <div className="dm-preview">
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>What commenters will receive:</div>
                  <div className="dm-bubble">
                    <div>{draft.dmMessage.replace('{name}', 'Sarah').replace('{username}', 'sarah_ig')}</div>
                    {links.filter(l => l.label && l.url).map((l, i) => (
                      <div key={i} className="dm-link-btn">🔗 {l.label}</div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── LINKS tab ── */}
          {tab === 'links' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Links are appended to every DM for this automation.
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setLinks([...links, { label: '', url: '' }])}>
                  ➕ Add Link
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((l, i) => (
                  <div key={i} className="link-pair">
                    <input className="input" placeholder="Button label" value={l.label}
                      onChange={e => { const u = [...links]; u[i] = { ...u[i], label: e.target.value }; setLinks(u); }} />
                    <input className="input" placeholder="https://your-link.com" value={l.url}
                      onChange={e => { const u = [...links]; u[i] = { ...u[i], url: e.target.value }; setLinks(u); }} />
                    <button className="btn btn-icon btn-danger" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 {isNew ? 'Create Automation' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Media Thumbnail ──────────────────────────────────────────────────────────

function MediaThumbnail({ item, onPick, selected }: { item: IGMedia; onPick: () => void; selected: boolean }) {
  const thumb = item.thumbnail_url || item.media_url;
  const isVideo = item.media_type === 'VIDEO';
  const isCarousel = item.media_type === 'CAROUSEL_ALBUM';

  return (
    <button
      onClick={onPick}
      style={{
        position: 'relative', padding: 0, border: selected ? '2px solid var(--accent-purple)' : '2px solid transparent',
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
        aspectRatio: '1', transition: 'all 0.15s',
      }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          {isVideo ? '🎬' : isCarousel ? '🖼️' : '📷'}
        </div>
      )}
      <div style={{
        position: 'absolute', top: 4, right: 4, fontSize: 14,
        background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 4px', lineHeight: 1,
      }}>
        {isVideo ? '🎬' : isCarousel ? '🖼️' : ''}
      </div>
      {selected && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>✅</div>
      )}
    </button>
  );
}

// ─── Webhook Section ──────────────────────────────────────────────────────────

function WebhookSection({ page, deployedUrl, pageId, showToast, reloadPage }: {
  page: PageConfig;
  deployedUrl: string;
  pageId: string;
  showToast: (m: string, t?: 'success' | 'error') => void;
  reloadPage: () => void;
}) {
  const webhookUrl = `${deployedUrl}/api/webhook`;
  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));

  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);

  // Token update state
  const [newToken, setNewToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setDiagLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/diagnostics`);
      const data = await res.json();
      setDiagData(data);
    } catch {}
    setDiagLoading(false);
  }, [pageId]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/diagnostics`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Page successfully subscribed to Webhook events!', 'success');
      fetchDiagnostics();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
    setSubscribing(false);
  };

  const handleSaveToken = async () => {
    if (!newToken.trim()) return;
    setSavingToken(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageAccessToken: newToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Page Access Token updated successfully!', 'success');
      setNewToken('');
      reloadPage();
      fetchDiagnostics();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
    setSavingToken(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Meta Permissions & Connection Health ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">🛡️ Meta Token & Permissions Health Check</div>
          <button className="btn btn-sm btn-ghost" onClick={fetchDiagnostics} disabled={diagLoading}>
            {diagLoading ? 'Checking...' : '🔄 Refresh Status'}
          </button>
        </div>

        {diagData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {diagData.missingCriticalCount > 0 && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: 13, lineHeight: 1.5,
              }}>
                <strong>⚠️ Missing Required Permissions:</strong> Your access token is missing {diagData.missingCriticalCount} required Meta permission(s). Without these, Instagram blocks direct messages and comment reading.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {diagData.permissions?.map((p: any) => (
                <div
                  key={p.key}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: p.granted ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${p.granted ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: p.granted ? 'var(--text-primary)' : '#f87171' }}>{p.key}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 16 }}>{p.granted ? '✅' : '❌'}</div>
                </div>
              ))}
            </div>

            {/* Page Webhook Subscription Edge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Page Webhook Edge (`subscribed_apps`)</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {diagData.subscribedToWebhooks
                    ? `✅ Page is subscribed (Fields: ${diagData.subscribedFields?.join(', ') || 'feed, messages, comments'})`
                    : '❌ Page has not registered to forward webhooks to this app'}
                </div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? 'Subscribing...' : '🔌 Subscribe Page Now'}
              </button>
            </div>

            {/* Token Update box */}
            <div style={{ marginTop: 8, padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔑 Update Page Access Token</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Generated a new token with <code style={{ color: '#a78bfa' }}>instagram_manage_messages</code> and <code style={{ color: '#a78bfa' }}>instagram_manage_comments</code>? Paste it here to update immediately:
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                  placeholder="Paste new EAA... token here"
                  value={newToken}
                  onChange={e => setNewToken(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSaveToken}
                  disabled={savingToken || !newToken.trim()}
                >
                  {savingToken ? 'Saving...' : '💾 Update Token'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Webhook URLs & Verify Token ── */}
      <div className="card">
        <div className="card-header"><div className="card-title">🌐 Webhook Configuration</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="webhook-box">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>📡 Webhook URL</div>
                <div className="code-copy">
                  <span>{webhookUrl}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => copy(webhookUrl)}>📋 Copy</button>
                </div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>🔐 Verify Token</div>
                <div className="code-copy">
                  <span>{page.webhookVerifyToken}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => copy(page.webhookVerifyToken)}>📋 Copy</button>
                </div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>🆔 IG Business Account ID</div>
                <div className="code-copy">
                  <span>{page.igUserId}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => copy(page.igUserId)}>📋 Copy</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">📋 Setup Checklist for Meta Dashboard</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Go to Meta Graph API Explorer and ensure token has: instagram_manage_messages, instagram_manage_comments, pages_manage_metadata, instagram_basic',
                'Go to Meta App Dashboard → Webhooks → Select "Instagram" from dropdown',
                'Click "Add Callback URL" → paste the Webhook URL and Verify Token above',
                'Subscribe to the "comments" field (and "messages" field)',
                'Click "🔌 Subscribe Page Now" button in the health check card above',
                'On your phone in Instagram app: Settings > Messages and story replies > Message controls > Connected tools > turn ON "Allow access to messages"',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test Section ─────────────────────────────────────────────────────────────

function TestSection({ page, pageId, showToast }: { page: PageConfig; pageId: string; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [testRecipient, setTestRecipient] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // Simulated comment state
  const [simText, setSimText] = useState('erra');
  const [simUser, setSimUser] = useState('tester');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const sendTestDM = async () => {
    if (!testRecipient.trim()) return;
    setTestLoading(true);
    try {
      const res = await fetch('/api/test-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, recipientIgId: testRecipient }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Test DM sent! Check your Instagram.');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
    setTestLoading(false);
  };

  const simulateComment = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/test-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          commentText: simText,
          commenterUsername: simUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Comment simulated! Check Events tab.', 'success');
      setSimResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      showToast(e.message, 'error');
      setSimResult(`Error: ${e.message}`);
    }
    setSimLoading(false);
  };

  const firstRule = page.automations[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Simulate Comment Webhook ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚡ Test & Simulate Comment Webhook</div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Simulate an Instagram user commenting on your Reel to verify keyword matching and automation execution without waiting for live Instagram events.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Comment Text</label>
            <input
              className="input"
              value={simText}
              onChange={e => setSimText(e.target.value)}
              placeholder="e.g. erra, link, info"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Commenter Username</label>
            <input
              className="input"
              value={simUser}
              onChange={e => setSimUser(e.target.value)}
              placeholder="e.g. tester_alex"
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={simulateComment}
          disabled={simLoading || !simText.trim()}
        >
          {simLoading ? <><div className="spinner" />Simulating...</> : '🚀 Simulate Comment & Trigger Automation'}
        </button>

        {simResult && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {simResult}
          </div>
        )}
      </div>

      {/* ── Direct Test DM ── */}
      <div className="card">
        <div className="card-header"><div className="card-title">🧪 Direct Test DM</div></div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Send a direct test DM using the first active automation rule&apos;s message. (Note: Instagram only allows direct DMs if the user has messaged the account before; comment triggers use private replies instead).
        </p>
        <div className="form-group">
          <label className="form-label">Instagram Scoped User ID (Recipient)</label>
          <input
            className="input"
            placeholder="e.g. 17841400000000001"
            value={testRecipient}
            onChange={e => setTestRecipient(e.target.value)}
          />
          <div className="form-hint">Your own IG scoped user ID from Graph API Explorer.</div>
        </div>
        <button className="btn btn-secondary mt-4" onClick={sendTestDM} disabled={testLoading || !testRecipient}>
          {testLoading ? <><div className="spinner" />Sending...</> : '📩 Send Direct DM'}
        </button>

        {firstRule && (
          <>
            <div className="divider" />
            <div className="section-title">👁️ DM Preview ({firstRule.name})</div>
            <div className="dm-preview">
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>What commenters will receive:</div>
              <div className="dm-bubble">
                <div>{firstRule.dmMessage.replace('{name}', 'You').replace('{username}', 'you')}</div>
                {firstRule.dmLinks.map((l, i) => (
                  <div key={i} className="dm-link-btn">🔗 {l.label}: {l.url}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
