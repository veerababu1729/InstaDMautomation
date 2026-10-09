'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CheckItem {
  id: string;
  label: string;
}

const CHECKLIST_ITEMS: CheckItem[] = [
  { id: 'ig_pro', label: 'Instagram switched to Professional (Creator or Business) account' },
  { id: 'fb_linked', label: 'Instagram linked to a Facebook Business/Creator Page' },
  { id: 'msg_allow', label: '"Allow access to messages" enabled in Instagram mobile app' },
  { id: 'meta_app', label: 'Meta Developer App created (Business type, Instagram & Webhooks added)' },
  { id: 'app_secret', label: 'Meta App Secret & App ID retrieved from App Settings ➔ Basic' },
  { id: 'page_token', label: 'Long-lived Page Access Token generated via Graph API Explorer' },
  { id: 'ig_id', label: 'Instagram Business Account ID identified (or auto-fetched)' },
  { id: 'webhook', label: 'Webhook configured & comments field subscribed in Meta Console' },
];

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="container" style={{ maxWidth: 880, paddingBottom: 80 }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(138,92,246,0.12)', border: '1px solid rgba(138,92,246,0.3)', color: 'var(--accent-purple)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          <span>🚀 Zero-to-Hero Guide</span>
        </div>
        <h1 style={{ fontSize: 34, marginBottom: 12, lineHeight: 1.2 }}>
          Instagram DM Automation <span className="text-gradient">Setup Guide</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Everything a beginner needs to set up Meta Developer keys, generate long-lived Page tokens, and run 100% automated comment-to-DM flows.
        </p>
      </div>

      {/* ── Interactive Progress & Quick Nav ── */}
      <div className="card" style={{ marginBottom: 32, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(138,92,246,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋 Setup Checklist</span>
            <span style={{ fontSize: 12, color: 'var(--accent-purple)', background: 'rgba(138,92,246,0.1)', padding: '2px 8px', borderRadius: 12 }}>
              {completedCount} of {CHECKLIST_ITEMS.length} completed ({progressPercent}%)
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Check off steps as you finish them
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--gradient-brand)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Checklist toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
          {CHECKLIST_ITEMS.map(item => (
            <label
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 12,
                color: checkedItems[item.id] ? 'var(--text-muted)' : 'var(--text-secondary)',
                textDecoration: checkedItems[item.id] ? 'line-through' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '4px 6px',
                borderRadius: 6,
                background: checkedItems[item.id] ? 'rgba(16,185,129,0.04)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={!!checkedItems[item.id]}
                onChange={() => {}}
                style={{ marginTop: 2, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        {/* Jump-to nav pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Jump to:</span>
          <a href="#prerequisites" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>⚡ 0. Prerequisites</a>
          <a href="#step1" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>🔑 1. Meta App & Secret</a>
          <a href="#step2" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>🎟️ 2. Page Token & IG ID</a>
          <a href="#step3" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>🛡️ 3. Roles & Live Mode</a>
          <a href="#step4" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>☁️ 4. Deploy & Database</a>
          <a href="#step5" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>📡 5. Webhook Setup</a>
          <a href="#troubleshooting" className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>🛠️ Troubleshooting</a>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── STEP 0: PREREQUISITES ── */}
        <div id="prerequisites" className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)', marginBottom: 4 }}>
                Before You Begin • Must Do
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 0 — Instagram & Facebook Prerequisites
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Meta&#39;s API requires 3 mandatory account settings before any automation or tokens will work. Check all 3 on your phone right now:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Prereq 1 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>1. Switch Instagram to a Professional Account (Free)</strong>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>Required</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 26 }}>
                Personal Instagram accounts <strong>cannot</strong> use the Meta Graph API.
                <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
                  Instagram App ➔ Profile ➔ ≡ (Menu top-right) ➔ Settings and privacy ➔ For professionals / Account type ➔ <strong>"Switch to professional account"</strong> (Choose "Creator" or "Business").
                </div>
              </div>
            </div>

            {/* Prereq 2 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>🔗</span>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>2. Link Instagram to a Facebook Page</strong>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>Required</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 26 }}>
                Meta&#39;s Graph API manages Instagram through a linked Facebook Page. If you don&#39;t have a Facebook Page yet, create one for free at <a href="https://facebook.com/pages/create" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)', textDecoration: 'underline' }}>facebook.com/pages/create</a>.
                <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
                  Go to your Facebook Page ➔ Settings ➔ Linked Accounts ➔ Instagram ➔ Click <strong>"Connect Account"</strong> and log in.
                </div>
              </div>
            </div>

            {/* Prereq 3 */}
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <strong style={{ fontSize: 14, color: '#fca5a5' }}>3. Enable "Allow Access to Messages" in Instagram Settings</strong>
                <span className="badge badge-error" style={{ fontSize: 10 }}>Crucial</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 26 }}>
                <span style={{ color: '#fca5a5' }}>If you skip this, Meta will block automated DMs with error: <em>(#230) Permissions error</em>.</span>
                <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, color: '#f8fafc' }}>
                  On phone Instagram app ➔ Settings and privacy ➔ Messages and story replies ➔ Message controls ➔ Connected tools ➔ Turn <strong>ON</strong> "Allow access to messages".
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 1: CREATE META DEVELOPER APP ── */}
        <div id="step1" className="card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', marginBottom: 4 }}>
                Phase 1 • App Credentials
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 1 — Create a Meta Developer App & Get App Secret
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            The Meta Developer App acts as the bridge connecting your server to Instagram&#39;s API. Follow these exact steps to register your app and copy your <strong>App ID</strong> and <strong>App Secret</strong>.
          </p>

          {/* Substeps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* 1.1 Register */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(138,92,246,0.15)', border: '1px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Log into Meta for Developers
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Visit <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>developers.facebook.com</a> and click <strong>Log In</strong> with the Facebook account that is admin of your Page.
                  <br />
                  <em>First time here?</em> Click <strong>"Get Started"</strong> in top-right, agree to terms, and verify your account via phone or email (100% free).
                </div>
              </div>
            </div>

            {/* 1.2 Create App */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(138,92,246,0.15)', border: '1px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Click "Create App" and Choose App Type
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Click <strong>"My Apps"</strong> in the top navigation bar, then click the green <strong>"Create App"</strong> button.
                  <div style={{ marginTop: 8, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Meta Selection Wizard:</div>
                    <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                      <li>If asked <em>"What do you want your app to do?"</em> ➔ Select <strong>"Other"</strong> ➔ Click <strong>Next</strong>.</li>
                      <li>On <em>"Select an app type"</em> ➔ Select <strong>"Business"</strong> ➔ Click <strong>Next</strong>. (Do not pick Consumer or Gaming).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.3 Name and details */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(138,92,246,0.15)', border: '1px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Fill in App Details & Create
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 6 }}>
                    <div>• <strong>App Name</strong>: Enter a name like <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>My Brand Automations</code>.</div>
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: '8px 12px', borderRadius: 6, color: '#fcd34d', fontSize: 12 }}>
                      ⚠️ <strong>Crucial Naming Rule:</strong> Do <em>not</em> use words like <strong>"Instagram"</strong>, <strong>"IG"</strong>, <strong>"Facebook"</strong>, or <strong>"Meta"</strong> in the app name. Meta automatically rejects trademarks!
                    </div>
                    <div>• <strong>App Contact Email</strong>: Enter your email address.</div>
                    <div>• <strong>Business Portfolio</strong>: Select your business account if you have one, or leave as "No Business Portfolio yet".</div>
                    <div>• Click <strong>"Create app"</strong> (Meta will prompt for your Facebook password).</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.4 Add Products */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(138,92,246,0.15)', border: '1px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>
                4
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Add Products to Your App
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Scroll down the <strong>Add Products</strong> page (or click <strong>Dashboard</strong> ➔ <strong>Add Product</strong> in left sidebar):
                  <div style={{ marginTop: 8, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                      <li>
                        Scroll down to find the card labeled <strong>"Instagram Graph API"</strong> ➔ Click the <strong>"Set up"</strong> button. 
                        <br />
                        <span style={{ color: 'var(--accent-orange)' }}>⚠️ <em>CRITICAL:</em> Do <strong>not</strong> select "Instagram Basic Display". That is a different product!</span>
                        <br />
                        Once added, it will take you to its settings page. You don't need to configure anything there right now.
                      </li>
                      <li style={{ marginTop: 8 }}>
                        Go back to Add Products. Find the card labeled <strong>"Webhooks"</strong> ➔ Click the <strong>"Set up"</strong> button.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.5 Copy App Secret */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                5
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Copy your App ID and App Secret
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  In the left sidebar, navigate to <strong>App settings</strong> ➔ <strong>Basic</strong>:
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>📌 App ID (15–16 digits)</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Visible at the top. Used to identify your application.</div>
                    </div>
                    <div style={{ background: 'rgba(138,92,246,0.08)', border: '1px solid rgba(138,92,246,0.3)', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple)' }}>🔐 App Secret (Needed for Step 1 of Onboarding)</div>
                        <span className="badge badge-purple" style={{ fontSize: 10 }}>Required</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        The App Secret is hidden with asterisks (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>••••••••••••</code>). Click the <strong>"Show"</strong> button, re-enter your Facebook password, and copy the revealed secret key!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Step 1 Outcome */}
          <div style={{ marginTop: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#6ee7b7' }}>
            ✅ <strong>Step 1 Checklist Complete:</strong> You now have your <strong>App Secret</strong>. Keep it copied in your clipboard or notes, ready to paste into the InstaDM Add Page wizard!
          </div>
        </div>

        {/* ── STEP 2: GENERATE PAGE ACCESS TOKEN ── */}
        <div id="step2" className="card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-pink)', marginBottom: 4 }}>
                Phase 2 • The Most Important Step
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 2 — Generate Long-Lived Page Access Token & Get IG User ID
              </h2>
            </div>
          </div>

          {/* Beginner explanation banner */}
          <div style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-pink)', marginBottom: 6 }}>
              💡 Why beginners get confused by tokens:
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 8 }}>
                <strong>User Token vs Page Token:</strong> A <em>User Token</em> represents you as a person. But Meta requires a <strong>Page Access Token</strong> to send DMs and reply to comments on behalf of your Instagram Business profile.
              </p>
              <p>
                <strong>Short-Lived vs Long-Lived Token:</strong> Tokens generated in the Graph API Explorer default to expiring in <strong>1 hour</strong>! If you don&#39;t extend it, your automation will die after 60 minutes. We show you how to extend it to a <strong>60-day / permanent token</strong> in 2 clicks below.
              </p>
            </div>
          </div>

          {/* Substeps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 2.1 Graph API Explorer */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Open the Graph API Explorer
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>developers.facebook.com/tools/explorer</a> in a new browser tab.
                </div>
              </div>
            </div>

            {/* 2.2 Switch Meta App */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Select YOUR Meta App in the Dropdown
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  In the top-right toolbar of the Graph API Explorer, find the <strong>"Meta App"</strong> dropdown.
                  <div style={{ marginTop: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '8px 12px', borderRadius: 6, color: '#fca5a5', fontSize: 12 }}>
                    🚨 <strong>Common Mistake:</strong> It defaults to <em>"Graph API Explorer"</em>. You <strong>MUST</strong> click the dropdown and select <strong>YOUR newly created App</strong> (the one from Step 1)!
                  </div>
                </div>
              </div>
            </div>

            {/* 2.3 Select Permissions */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Add the Required Permissions
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleCopy('pages_show_list, pages_read_engagement, pages_messaging, instagram_basic, instagram_manage_comments, instagram_manage_insights', 'perm_all')}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    {copiedId === 'perm_all' ? '✓ Copied All' : '📋 Copy Permissions List'}
                  </button>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                  On the right panel under <strong>"Permissions"</strong>, click <strong>"Add a Permission"</strong> dropdown and add each of these:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                  {[
                    { name: 'pages_show_list', desc: 'Finds your linked Facebook Pages', cat: 'Pages' },
                    { name: 'pages_read_engagement', desc: 'Reads engagement on posts', cat: 'Pages' },
                    { name: 'pages_messaging', desc: 'Allows sending automated DMs', cat: 'Pages (DMs)' },
                    { name: 'instagram_basic', desc: 'Reads IG profile & user IDs', cat: 'Instagram' },
                    { name: 'instagram_manage_comments', desc: 'Reads comments & posts replies', cat: 'Instagram' },
                    { name: 'instagram_manage_insights', desc: 'Optional: Checks if commenter follows you', cat: 'Follow Gate' },
                  ].map(p => (
                    <div
                      key={p.name}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-purple)', fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
                      </div>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleCopy(p.name, p.name)}
                        style={{ padding: '2px 6px', fontSize: 10 }}
                        title="Copy permission name"
                      >
                        {copiedId === p.name ? '✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2.4 Generate token */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                4
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Click "Generate Access Token" & Select Both Accounts
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Click the blue <strong>"Generate Access Token"</strong> button. A Facebook popup will appear:
                  <ul style={{ paddingLeft: 18, marginTop: 6, lineHeight: 1.8 }}>
                    <li>Click <strong>"Continue as [Your Name]"</strong>.</li>
                    <li><strong>Select your Facebook Page:</strong> Check the box for your Page.</li>
                    <li><strong>Select your Instagram account:</strong> Check the box for your linked Instagram Business profile. <em>(Make sure both are checked!)</em></li>
                    <li>Allow all requested permissions and click <strong>"Done"</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2.5 Switch to Page Access Token */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                5
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Switch Dropdown to "Page Access Token"
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Now look back at the top-right toolbar of Graph API Explorer:
                  <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div>1. Click the <strong>"User or Page"</strong> dropdown (it currently says <em>"User Token"</em>).</div>
                    <div>2. Scroll down to the <strong>"Page Access Tokens"</strong> section.</div>
                    <div>3. Select <strong>YOUR Facebook Page</strong>!</div>
                    <div style={{ marginTop: 6, color: 'var(--accent-green)', fontWeight: 500 }}>
                      ⚡ The token in the Access Token box will instantly update to your Page Access Token (starts with <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>EAA...</code>).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.6 Extend to Long-Lived Token */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                6
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Extend to a Long-Lived Token (60-Day / Permanent)
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Don&#39;t let your token expire after 1 hour! Extend it in 2 simple clicks:
                  <div style={{ marginTop: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: 14 }}>
                    <ol style={{ paddingLeft: 18, lineHeight: 1.9 }}>
                      <li>
                        Right next to the Access Token input field, click the small blue info icon <strong>ⓘ</strong>.
                      </li>
                      <li>
                        In the popup card that opens, click the button: <strong>"Open in Access Token Tool"</strong> (this opens Meta&#39;s Access Token Debugger).
                      </li>
                      <li>
                        Scroll down to the bottom of the page and click the blue button: <strong>"Extend Access Token"</strong>.
                      </li>
                      <li>
                        Meta will generate a new <strong>Long-Lived Access Token</strong> in a box below.
                      </li>
                      <li>
                        <strong>Copy this extended token!</strong> This is the <strong>Page Access Token</strong> to paste into InstaDM Add Page wizard.
                      </li>
                    </ol>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 <em>Note:</em> For Facebook Pages, long-lived Page tokens have <strong>no expiration date</strong> as long as you do not change your Facebook password or revoke app access.
                  </div>
                </div>
              </div>
            </div>

            {/* 2.7 Find IG User ID */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', border: '1px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-pink)', flexShrink: 0 }}>
                7
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    (Optional) Find your Instagram Business Account ID
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleCopy('me?fields=id,name,instagram_business_account', 'query_copy')}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    {copiedId === 'query_copy' ? '✓ Copied Query' : '📋 Copy Query'}
                  </button>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  With your Page Access Token selected in Graph API Explorer:
                  <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>1. Paste this into the endpoint bar next to GET:</div>
                    <div className="code-copy" style={{ marginBottom: 8 }}>
                      <span>me?fields=id,name,instagram_business_account</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleCopy('me?fields=id,name,instagram_business_account', 'query_copy2')}>
                        {copiedId === 'query_copy2' ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>2. Click <strong>Submit</strong>. You will receive a response like this:</div>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 6, fontSize: 12, color: '#a7f3d0', overflowX: 'auto', lineHeight: 1.5 }}>
{`{
  "id": "109823412345678",                 // Facebook Page ID
  "name": "My Brand Name",
  "instagram_business_account": {
    "id": "17841405829102934"            // <-- THIS IS YOUR IG USER ID!
  }
}`}
                    </pre>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 <em>Pro-Tip:</em> If you leave IG User ID blank during InstaDM Onboarding, our server will automatically fetch this for you using your token! But having it verified here ensures your Facebook Page and Instagram are properly linked.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Step 2 Outcome */}
          <div style={{ marginTop: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#6ee7b7' }}>
            🎉 <strong>Step 2 Checklist Complete:</strong> You now have your <strong>Long-Lived Page Access Token</strong> and <strong>Instagram Business Account ID</strong>!
          </div>
        </div>

        {/* ── STEP 3: APP ROLES & LIVE MODE ── */}
        <div id="step3" className="card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-orange)', marginBottom: 4 }}>
                Phase 3 • Development vs Live Mode
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 3 — App Roles, Testers & Live Mode
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            By default, newly created Meta Apps are in <strong>Development Mode</strong>. Here is how testing works and how to go live for everyone:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Development Mode */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-inactive">Development Mode (Default)</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                In Development Mode, only accounts with a role on your app can trigger automated replies and receive DMs.
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, fontSize: 12 }}>
                  <strong>To test from another account:</strong>
                  <br />
                  In Meta App Dashboard ➔ <strong>App roles</strong> ➔ <strong>Roles</strong> ➔ Click <strong>"Add Testers"</strong> (or "Add Instagram Testers") ➔ enter their Instagram username.
                </div>
              </div>
            </div>

            {/* Live Mode */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-active">Live Mode (For Everyone)</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                In Live Mode, <em>any user in the world</em> who comments on your Reels will automatically receive replies and DMs!
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, fontSize: 12 }}>
                  <strong>To turn on Live Mode:</strong>
                  <br />
                  1. App settings ➔ Basic ➔ Add a Privacy Policy URL. 
                  <br />
                  <span style={{ color: 'var(--text-muted)' }}>(Tip: Once you deploy to Vercel in Step 4, you can use your own app's built-in policy at <code>https://[your-app].vercel.app/privacy</code>)</span>
                  <br />
                  2. At top header, flip the toggle from <strong>Development</strong> to <strong>Live</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 4: DEPLOY & DATABASE ── */}
        <div id="step4" className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-green)', marginBottom: 4 }}>
                Phase 4 • Hosting & Storage
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 4 — Deploy to Vercel & Connect Database
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            Deploy your app so Meta&#39;s webhooks can reach it 24/7 with zero server maintenance.
          </p>

          <ol style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)', fontSize: 14 }}>
            <li>Push this repository to your GitHub account.</li>
            <li>Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)' }}>vercel.com/new</a> and click <strong>Import</strong> on your repo.</li>
            <li>
              <strong>Add Database Storage (Free Upstash / Vercel KV):</strong>
              <div style={{ margin: '6px 0 10px', padding: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, fontSize: 13 }}>
                In your Vercel Project Dashboard ➔ <strong>Storage</strong> tab ➔ <strong>Create Database</strong> ➔ Select <strong>KV (Upstash)</strong>.
                <br />
                Vercel will <strong>automatically configure</strong> the required environment variables:
              </div>
            </li>
          </ol>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'KV_REST_API_URL', desc: 'Auto-set by Vercel KV or from console.upstash.com' },
              { key: 'KV_REST_API_TOKEN', desc: 'Auto-set by Vercel KV or from console.upstash.com' },
              { key: 'NEXT_PUBLIC_VERCEL_URL', desc: 'Auto-set by Vercel (your custom deployment domain)' },
            ].map(env => (
              <div key={env.key} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600 }}>{env.key}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{env.desc}</div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleCopy(env.key, env.key)}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  {copiedId === env.key ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            💡 <em>Local Testing Note:</em> When running locally with <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>npm run dev</code>, the app automatically falls back to an in-memory store if Redis variables are not present.
          </div>
        </div>

        {/* ── STEP 5: CONFIGURE WEBHOOK ── */}
        <div id="step5" className="card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', marginBottom: 4 }}>
                Phase 5 • Live Connection
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                Step 5 — Configure Meta Webhook & Go Live
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            A webhook allows Meta to instantly notify your application whenever someone leaves a comment on your Reels or posts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                step: 1,
                title: 'Add your page in InstaDM',
                desc: 'Click "Add Page" in the InstaDM navigation bar. Paste your Page Access Token and App Secret from Steps 1 & 2. Save your trigger keywords and DM message.',
              },
              {
                step: 2,
                title: 'Copy your Webhook URL & Verify Token',
                desc: 'On the Webhook step of the onboard wizard (or inside Page Config ➔ Webhook Setup), copy the unique Webhook URL and Verify Token generated for your page.',
              },
              {
                step: 3,
                title: 'Add Callback URL in Meta Dashboard',
                desc: 'In Meta Developer Dashboard ➔ Instagram ➔ Webhooks (or Products ➔ Webhooks ➔ Instagram) ➔ Click "Add Callback URL" (or Edit Subscription).',
              },
              {
                step: 4,
                title: 'Paste URL & Verify Token',
                desc: 'Paste your Webhook URL into "Callback URL" and paste your token into "Verify Token". Click "Verify and Save". Meta will instantly verify your live server!',
              },
              {
                step: 5,
                title: 'Subscribe to the "comments" field',
                desc: 'In the Instagram Webhook subscriptions table, find the "comments" row and click the blue "Subscribe" button.',
              },
              {
                step: 6,
                title: 'Turn on Automation Toggle 🚀',
                desc: 'Inside your InstaDM Page dashboard, switch the "Automation Enabled" toggle to ON. Post a test comment on any Reel with your keyword (e.g. "link") and watch the magic happen!',
              },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TROUBLESHOOTING & FAQ ── */}
        <div id="troubleshooting" className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-red)', marginBottom: 4 }}>
                Common Gotchas
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--text-primary)' }}>
                🛠️ Beginner Troubleshooting & Fixes
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                icon: '🚫',
                issue: 'Error: (#230) Permissions error / User cannot be messaged',
                fix: 'You forgot Prerequisite #3! Open your phone Instagram app ➔ Settings and privacy ➔ Messages and story replies ➔ Message controls ➔ Connected tools ➔ Turn ON "Allow access to messages".',
              },
              {
                icon: '⌛',
                issue: 'Automation suddenly stopped working after 1 hour',
                fix: 'You used a short-lived temporary token from Graph API Explorer. Re-do Step 2.6: click the blue info ⓘ icon next to the token, open the Access Token Tool, and click "Extend Access Token" to get a 60-day or permanent token.',
              },
              {
                icon: '👥',
                issue: 'DMs only send when I test with my own account, not followers',
                fix: 'Your Meta App is still in "Development Mode". Either add your followers\' accounts as Testers in Meta Dashboard ➔ App Roles ➔ Roles, or flip the toggle at the top of Meta Dashboard to "Live Mode" (Step 3).',
              },
              {
                icon: '🔍',
                issue: 'Response for "instagram_business_account" returns null or empty',
                fix: 'Your Instagram profile is not properly connected to your Facebook Page, or is still set as a Personal account. Open your Facebook Page Settings ➔ Linked Accounts ➔ Instagram ➔ Disconnect and re-link your Instagram account.',
              },
              {
                icon: '❌',
                issue: 'Webhook verification failed: The URL couldn\'t be validated',
                fix: 'Make sure your Vercel deployment is live and accessible. Ensure there are no trailing slashes or typos in the URL, and that you entered the exact Verify Token displayed on your InstaDM page config screen.',
              },
            ].map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{faq.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{faq.issue}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 24 }}>
                  <strong>Fix:</strong> {faq.fix}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTION CTA ── */}
        <div style={{ textAlign: 'center', padding: '32px 0 16px', background: 'var(--gradient-brand-subtle)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(138,92,246,0.2)' }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Ready to Automate Your Instagram?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Now that you have your Page Token and App Secret, you can connect your page in less than 60 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/onboard" className="btn btn-primary btn-lg">
              ➕ Add Your Page Now
            </Link>
            <Link href="/" className="btn btn-ghost btn-lg">
              🏠 Back to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
