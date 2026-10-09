'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageConfig } from '@/lib/types';

function timeAgo(ts: string | null) {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch { setPages([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalDMs = pages.reduce((s, p) => s + p.stats.totalDmsSent, 0);
  const totalComments = pages.reduce((s, p) => s + p.stats.totalCommentsTrigger, 0);
  const activePages = pages.filter(p => p.automation.enabled).length;

  const togglePage = async (page: PageConfig) => {
    await fetch(`/api/pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automation: { enabled: !page.automation.enabled } }),
    });
    load();
  };

  return (
    <div className="container">
      {/* Hero */}
      <div className="page-header">
        <h1>📱 <span className="text-gradient">InstaDM Automation</span></h1>
        <p>Comment → Reply → DM. Fully automated, minimal effort.</p>
      </div>

      {/* Hero banner when empty */}
      {!loading && pages.length === 0 && (
        <div className="hero-banner">
          <div className="hero-banner-icon">🚀</div>
          <div>
            <h2>Get Started in 2 Minutes</h2>
            <p>Connect your first Instagram page to start automating DMs from comments.</p>
            <Link href="/onboard" className="btn btn-primary mt-4">
              ➕ Add Your First Page
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      {pages.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">📄 Pages Connected</div>
            <div className="stat-value">{pages.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">✅ Active Automations</div>
            <div className="stat-value">{activePages}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💬 Comments Triggered</div>
            <div className="stat-value">{totalComments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📩 DMs Sent</div>
            <div className="stat-value">{totalDMs}</div>
          </div>
        </div>
      )}

      {/* Flow explanation */}
      {pages.length > 0 && (
        <div className="hero-banner mb-6" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', fontSize: '14px' }}>
            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#f59e0b' }}>💬 User Comments</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#3b82f6' }}>↩️ Auto Reply</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ background: 'rgba(138,92,246,0.15)', border: '1px solid rgba(138,92,246,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#8a5cf6' }}>📩 DM with Links</span>
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/onboard" className="btn btn-primary btn-sm">➕ Add Page</Link>
            </div>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      {loading ? (
        <div className="pages-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: 180 }}>
              <div className="skeleton" style={{ height: 48, width: 48, borderRadius: '50%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="pages-grid">
          {pages.map(page => (
            <div key={page.id} style={{ position: 'relative' }}>
              <Link href={`/pages/${page.id}`} className="page-card">
                <div className="page-card-header">
                  <div className="page-avatar">{page.name[0]?.toUpperCase() ?? '?'}</div>
                  <div>
                    <div className="page-card-name">{page.name}</div>
                    <div className="page-card-id">{page.igUserId || page.id}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span className={`badge ${page.automation.enabled ? 'badge-active' : 'badge-inactive'}`}>
                      {page.automation.enabled ? '● Live' : '○ Off'}
                    </span>
                  </div>
                </div>

                {/* Config summary */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {page.automation.triggerKeywords.length > 0 ? (
                    <span className="badge badge-purple">🔑 {page.automation.triggerKeywords.slice(0, 2).join(', ')}{page.automation.triggerKeywords.length > 2 ? '...' : ''}</span>
                  ) : (
                    <span className="badge badge-purple">🔑 All comments</span>
                  )}
                  {page.automation.requireFollow && <span className="badge badge-pink">👥 Follow gate</span>}
                  {page.automation.dmLinks.length > 0 && <span className="badge badge-purple">🔗 {page.automation.dmLinks.length} link{page.automation.dmLinks.length > 1 ? 's' : ''}</span>}
                </div>

                <div className="page-card-stats">
                  <div className="page-stat-item">
                    <div className="page-stat-num">{page.stats.totalCommentsTrigger}</div>
                    <div className="page-stat-lbl">Triggered</div>
                  </div>
                  <div className="page-stat-item">
                    <div className="page-stat-num">{page.stats.totalDmsSent}</div>
                    <div className="page-stat-lbl">DMs Sent</div>
                  </div>
                  <div className="page-stat-item">
                    <div className="page-stat-num" style={{ fontSize: '14px' }}>{timeAgo(page.stats.lastActivity)}</div>
                    <div className="page-stat-lbl">Last Activity</div>
                  </div>
                </div>
              </Link>

              {/* Quick toggle button */}
              <button
                onClick={(e) => { e.preventDefault(); togglePage(page); }}
                className={`btn btn-sm ${page.automation.enabled ? 'btn-danger' : 'btn-secondary'}`}
                style={{ position: 'absolute', top: '16px', right: '56px', fontSize: '11px', padding: '4px 10px' }}
              >
                {page.automation.enabled ? 'Pause' : 'Activate'}
              </button>
            </div>
          ))}

          {/* Add page card */}
          <Link href="/onboard" className="add-page-card">
            <div className="add-page-icon">➕</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Add Instagram Page</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connect another account</div>
          </Link>
        </div>
      )}
    </div>
  );
}
