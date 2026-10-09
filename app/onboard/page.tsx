'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['Credentials', 'Webhook'];

function Step1({
  data, setData, error, loading, onNext,
}: {
  data: Record<string, string>;
  setData: (d: Record<string, string>) => void;
  error: string;
  loading: boolean;
  onNext: () => void;
}) {
  const set = (k: string, v: string) => setData({ ...data, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="webhook-box" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>📋 Before you start:</strong><br />
          You need a <strong>Meta Developer App</strong> with <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>instagram_basic</code>, <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>instagram_manage_comments</code>, and <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>pages_messaging</code> permissions.
          {' '}<a href="/docs" style={{ color: 'var(--accent-purple)' }}>See setup guide →</a>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">📱 Instagram Business Account ID (IG User ID)</label>
        <input
          className="input"
          placeholder="e.g. 17841400000000000"
          value={data.igUserId || ''}
          onChange={e => set('igUserId', e.target.value)}
        />
        <div className="form-hint">Found in Business Suite → Settings → Instagram Account → About. Or leave blank to auto-fetch.</div>
      </div>

      <div className="form-group">
        <label className="form-label">🔑 Page Access Token</label>
        <input
          className="input"
          type="password"
          placeholder="Paste your long-lived Page Access Token"
          value={data.pageAccessToken || ''}
          onChange={e => set('pageAccessToken', e.target.value)}
        />
        <div className="form-hint">Generate from Meta Graph API Explorer with your page selected.</div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">🔐 App Secret</label>
          <input
            className="input"
            type="password"
            placeholder="Your Meta App Secret"
            value={data.appSecret || ''}
            onChange={e => set('appSecret', e.target.value)}
          />
          <div className="form-hint">From Meta App Dashboard → Settings → Basic.</div>
        </div>
        <div className="form-group">
          <label className="form-label">✏️ Page Name (optional)</label>
          <input
            className="input"
            placeholder="e.g. My Brand Page"
            value={data.customName || ''}
            onChange={e => set('customName', e.target.value)}
          />
          <div className="form-hint">Auto-fetched if blank.</div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#fca5a5', fontSize: 13 }}>
          ❌ {error}
        </div>
      )}

      <button className="btn btn-primary btn-lg" onClick={onNext} disabled={loading}>
        {loading ? <><div className="spinner" />Connecting...</> : 'Continue →'}
      </button>
    </div>
  );
}


function Step3({
  pageData, webhookToken, deployedUrl,
}: {
  pageData: Record<string, unknown>;
  webhookToken: string;
  deployedUrl: string;
}) {
  const router = useRouter();
  const webhookUrl = `${deployedUrl}/api/webhook`;

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>🎉 Page Connected Successfully!</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Now configure the Meta webhook to start receiving comment events.
        </div>
      </div>

      <div>
        <div className="section-title">🔗 Webhook Configuration</div>
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
                <span>{webhookToken}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => copy(webhookToken)}>📋 Copy</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title">📋 Steps to Configure in Meta</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Go to Meta Developer Dashboard → your App → Instagram → Webhooks',
            'Click "Add Callback URL" and paste the Webhook URL above',
            'Paste the Verify Token above in the "Verify Token" field',
            'Click "Verify and Save"',
            'Subscribe to the "comments" field under Instagram',
            'Enable the automation toggle on the page config screen',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => router.push(`/pages/${(pageData as { id?: string }).id || ''}`)}>
          Go to Page Config →
        </button>
        <button className="btn btn-ghost" onClick={() => router.push('/')}>Dashboard</button>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Record<string, string>>({});
  const [createdPage, setCreatedPage] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [deployedUrl, setDeployedUrl] = useState('');
  useEffect(() => {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    setDeployedUrl(vercelUrl ? `https://${vercelUrl}` : window.location.origin);
  }, []);

  const handleStep1Next = async () => {
    if (!step1Data.pageAccessToken || !step1Data.appSecret) {
      setError('Page Access Token and App Secret are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect page');
      setCreatedPage(data);
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1>➕ Add Instagram Page</h1>
        <p>Connect an Instagram Business account to automate DMs.</p>
      </div>

      {/* Steps indicator */}
      <div className="steps-header">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="step-circle">{i < step ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 32 }}>
        {step === 0 && (
          <Step1
            data={step1Data}
            setData={setStep1Data}
            error={error}
            loading={loading}
            onNext={handleStep1Next}
          />
        )}
        {step === 1 && createdPage && (
          <Step3
            pageData={createdPage}
            webhookToken={(createdPage.webhookVerifyToken as string) ?? ''}
            deployedUrl={deployedUrl}
          />
        )}
      </div>
    </div>
  );
}
