'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageConfig, EventLog } from '@/lib/types';

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

type Section = 'overview' | 'automation' | 'messages' | 'links' | 'webhook' | 'events' | 'test';

export default function PageConfigScreen() {
  const { pageId } = useParams<{ pageId: string }>();
  const router = useRouter();
  const [page, setPage] = useState<PageConfig | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [section, setSection] = useState<Section>('overview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deployedUrl, setDeployedUrl] = useState('');

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

  const save = async (updates: Partial<PageConfig> | { automation: Partial<PageConfig['automation']> }) => {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPage({ ...page, ...data });
      setSaved(true);
      showToast('Changes saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
    setSaving(false);
  };

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

  // deployedUrl is set via useEffect above

  const SIDEBAR_ITEMS: { id: Section; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'automation', label: 'Trigger Config', icon: '⚡' },
    { id: 'messages', label: 'Reply & DM', icon: '💬' },
    { id: 'links', label: 'Links', icon: '🔗' },
    { id: 'webhook', label: 'Webhook Setup', icon: '🌐' },
    { id: 'events', label: `Activity Log (${events.length})`, icon: '📋' },
    { id: 'test', label: 'Test & Debug', icon: '🧪' },
  ];

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className={`btn ${page.automation.enabled ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => save({ automation: { enabled: !page.automation.enabled } })}
          >
            {page.automation.enabled ? '⏸ Pause Automation' : '▶️ Activate Automation'}
          </button>
          <span className={`badge ${page.automation.enabled ? 'badge-active' : 'badge-inactive'}`}>
            {page.automation.enabled ? '● Live' : '○ Paused'}
          </span>
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

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <>
              <div className="stats-grid" style={{ marginBottom: 0 }}>
                <div className="stat-card">
                  <div className="stat-label">💬 Comments Triggered</div>
                  <div className="stat-value">{page.stats.totalCommentsTrigger}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">📩 DMs Sent</div>
                  <div className="stat-value">{page.stats.totalDmsSent}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">📈 DM Rate</div>
                  <div className="stat-value">
                    {page.stats.totalCommentsTrigger > 0
                      ? Math.round((page.stats.totalDmsSent / page.stats.totalCommentsTrigger) * 100) + '%'
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">⚙️ Current Config</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Trigger Keywords</span>
                    <span>{page.automation.triggerKeywords.length > 0 ? page.automation.triggerKeywords.join(', ') : <em style={{ color: 'var(--text-muted)' }}>All comments</em>}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Post</span>
                    <span style={{ maxWidth: 280, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {page.automation.triggerMediaUrl ? (
                        <a href={page.automation.triggerMediaUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)' }}>
                          {page.automation.triggerMediaUrl}
                        </a>
                      ) : <em style={{ color: 'var(--text-muted)' }}>All Posts & Reels</em>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Comment Reply</span>
                    <span style={{ maxWidth: 280, textAlign: 'right', color: 'var(--text-muted)' }}>{page.automation.replyComment || <em>None</em>}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>DM Links</span>
                    <span>{page.automation.dmLinks.length} link(s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Follow Gate</span>
                    <span className={`badge ${page.automation.requireFollow ? 'badge-pink' : 'badge-inactive'}`}>
                      {page.automation.requireFollow ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                    <span className={`badge ${page.automation.enabled ? 'badge-active' : 'badge-inactive'}`}>
                      {page.automation.enabled ? '● Active' : '○ Paused'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent events */}
              {events.slice(0, 5).length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">🕐 Recent Activity</div>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSection('events')}>View All</button>
                  </div>
                  <div className="event-list">
                    {events.slice(0, 5).map(e => (
                      <div key={e.id} className="event-item">
                        <div className={`event-icon ${e.type}`}>{EVENT_ICONS[e.type]}</div>
                        <div className="event-body">
                          <div className="event-title">{EVENT_LABELS[e.type]} — @{e.commenterName}</div>
                          <div className="event-detail">"{e.commentText.slice(0, 60)}{e.commentText.length > 60 ? '...' : ''}"</div>
                        </div>
                        <div className="event-time">{timeAgo(e.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── AUTOMATION ── */}
          {section === 'automation' && (
            <AutomationSection page={page} save={save} />
          )}

          {/* ── MESSAGES ── */}
          {section === 'messages' && (
            <MessagesSection page={page} save={save} />
          )}

          {/* ── LINKS ── */}
          {section === 'links' && (
            <LinksSection page={page} save={save} />
          )}

          {/* ── WEBHOOK ── */}
          {section === 'webhook' && (
            <WebhookSection page={page} deployedUrl={deployedUrl} />
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
            <div className="card">
              <div className="card-header"><div className="card-title">🧪 Test DM</div></div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Send a test DM to any Instagram user ID to verify your message looks correct.
              </p>
              <div className="form-group">
                <label className="form-label">Instagram Scoped User ID (Recipient)</label>
                <input
                  className="input"
                  placeholder="e.g. 17841400000000001"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                />
                <div className="form-hint">This is your own IG scoped user ID. You can find it via the Graph API Explorer: GET /me?access_token=...</div>
              </div>
              <button className="btn btn-primary mt-4" onClick={sendTestDM} disabled={testLoading || !testRecipient}>
                {testLoading ? <><div className="spinner" />Sending...</> : '📩 Send Test DM'}
              </button>

              {/* DM Preview */}
              <div className="divider" />
              <div className="section-title">👁️ DM Preview</div>
              <div className="dm-preview">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Message that will be sent:</div>
                <div className="dm-bubble">
                  <div>{page.automation.dmMessage.replace('{name}', 'You').replace('{username}', 'you')}</div>
                  {page.automation.dmLinks.map((l, i) => (
                    <div key={i} className="dm-link-btn">🔗 {l.label}: {l.url}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-sections ────────────────────────────────────────────────────────────────

function AutomationSection({ page, save }: { page: PageConfig; save: (u: object) => void }) {
  const [keywords, setKeywords] = useState(page.automation.triggerKeywords.join(', '));
  const [triggerMediaUrl, setTriggerMediaUrl] = useState(page.automation.triggerMediaUrl || '');
  const [requireFollow, setRequireFollow] = useState(page.automation.requireFollow);
  const [mediaFilter, setMediaFilter] = useState(page.automation.mediaFilter);

  const handleSave = () => {
    save({
      automation: {
        triggerKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        triggerMediaUrl: triggerMediaUrl.trim(),
        requireFollow,
        mediaFilter,
      },
    });
  };

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">⚡ Trigger Configuration</div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="form-group">
          <label className="form-label">🔑 Trigger Keywords</label>
          <input
            className="input"
            placeholder="link, dm me, send it (comma separated) — or leave empty for ALL comments"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
          />
          <div className="form-hint">
            Leave empty to trigger on every comment. Keywords are case-insensitive and checked with <em>contains</em>.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">🎬 Specific Post / Reel URL (Optional)</label>
          <input
            className="input"
            placeholder="https://www.instagram.com/p/..."
            value={triggerMediaUrl}
            onChange={e => setTriggerMediaUrl(e.target.value)}
          />
          <div className="form-hint">
            Only trigger DMs for comments on this specific post or reel. Leave empty to apply to all posts.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">📹 Media Filter</label>
          <select className="select" value={mediaFilter} onChange={e => setMediaFilter(e.target.value as typeof mediaFilter)}>
            <option value="all">All posts & reels</option>
            <option value="reels">Reels only</option>
            <option value="posts">Posts only</option>
          </select>
        </div>

        <div>
          <label className="toggle-wrapper" style={{ cursor: 'pointer' }}>
            <label className="toggle">
              <input type="checkbox" checked={requireFollow} onChange={e => setRequireFollow(e.target.checked)} />
              <div className="toggle-track" />
              <div className="toggle-thumb" />
            </label>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Require user to follow your page</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skip DM if commenter doesn't follow. Needs instagram_manage_insights permission.</div>
            </div>
          </label>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>💾 Save Changes</button>
      </div>
    </div>
  );
}

function MessagesSection({ page, save }: { page: PageConfig; save: (u: object) => void }) {
  const [reply, setReply] = useState(page.automation.replyComment);
  const [dm, setDm] = useState(page.automation.dmMessage);

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">💬 Reply & DM Messages</div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="form-group">
          <label className="form-label">↩️ Public Comment Reply</label>
          <textarea
            className="textarea"
            rows={2}
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Hey {name}! Check your DMs 📩"
          />
          <div className="form-hint">Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>{'{name}'}</code> and <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>{'{username}'}</code> as placeholders. Leave empty to skip public reply.</div>
        </div>

        <div className="form-group">
          <label className="form-label">📩 DM Message Body</label>
          <textarea
            className="textarea"
            rows={4}
            value={dm}
            onChange={e => setDm(e.target.value)}
            placeholder="Hey {name}! Here are the links you asked for 👇"
          />
          <div className="form-hint">Links configured in the Links section will be appended automatically.</div>
        </div>

        {/* Preview */}
        <div>
          <div className="section-title">👁️ Live Preview</div>
          <div className="dm-preview">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>What commenters will receive:</div>
            <div className="dm-bubble">
              <div>{dm.replace('{name}', 'Sarah').replace('{username}', 'sarah_ig')}</div>
              {page.automation.dmLinks.map((l, i) => (
                <div key={i} className="dm-link-btn">🔗 {l.label}</div>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => save({ automation: { replyComment: reply, dmMessage: dm } })}>
          💾 Save Changes
        </button>
      </div>
    </div>
  );
}

function LinksSection({ page, save }: { page: PageConfig; save: (u: object) => void }) {
  const [links, setLinks] = useState(page.automation.dmLinks.length > 0 ? page.automation.dmLinks : [{ label: '', url: '' }]);

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const setLink = (i: number, field: 'label' | 'url', val: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i], [field]: val };
    setLinks(updated);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🔗 DM Links</div>
        <button className="btn btn-sm btn-ghost" onClick={addLink}>➕ Add Link</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        These links are appended to every DM automatically.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((l, i) => (
          <div key={i} className="link-pair">
            <input className="input" placeholder="Button label" value={l.label} onChange={e => setLink(i, 'label', e.target.value)} />
            <input className="input" placeholder="https://your-link.com" value={l.url} onChange={e => setLink(i, 'url', e.target.value)} />
            <button className="btn btn-icon btn-danger" onClick={() => removeLink(i)}>✕</button>
          </div>
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={() => save({ automation: { dmLinks: links.filter(l => l.label && l.url) } })}>
        💾 Save Links
      </button>
    </div>
  );
}

function WebhookSection({ page, deployedUrl }: { page: PageConfig; deployedUrl: string }) {
  const webhookUrl = `${deployedUrl}/api/webhook`;
  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => alert('Copied!'));

  return (
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
          <div className="section-title">📋 Setup Steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Go to Meta Developer Dashboard → your App',
              'Navigate to Instagram → Webhooks (left sidebar)',
              'Click "Add Callback URL" → paste the Webhook URL',
              'Enter the Verify Token → click "Verify and Save"',
              'Subscribe to the "comments" field',
              'Go back here and click "Activate Automation"',
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

        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#fcd34d' }}>
          ⚠️ <strong>Required Permissions:</strong> Make sure your Meta App has{' '}
          <code>instagram_basic</code>, <code>instagram_manage_comments</code>, <code>pages_messaging</code>
          {page.automation.requireFollow && <>, <code>instagram_manage_insights</code></>} approved.
        </div>
      </div>
    </div>
  );
}
