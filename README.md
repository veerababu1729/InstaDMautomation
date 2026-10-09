# InstaDM Automation 🚀

A high-performance, self-hosted Instagram DM & Comment automation platform built for creators, marketers, and brands running one or multiple Instagram business accounts.

Automates the complete viral growth funnel:
1. **Audience comments on your Reel / Post** (e.g. *"link"*, *"guide"*, or any comment).
2. **Instant public comment reply** (e.g. *"Sent you a DM @username! 🚀"*).
3. **Automated private DM with your links** (with optional follow verification gate).

---

## ✨ Features

- 📱 **Multi-Page Onboarding UI** — Connect and manage unlimited Instagram accounts independently.
- 🎯 **Minimal-Effort Reel Automation** — Set keyword triggers (*"link"*, *"pdf"*, *"scale"*) or trigger on all comments.
- ⚡ **Instant Public Comment Reply** — Auto-replies publicly to boost algorithmic engagement on your Reel.
- 📩 **Dynamic DM Dispatch** — Dispatches personalized DMs with rich clickable links.
- 🔒 **Follow-Gating (Optional)** — Only send the DM if the user follows your account, maximizing follower growth.
- 📊 **Real-time Event Logs & Analytics** — Track every comment, reply, DM dispatched, and skipped action live.
- 🧪 **Built-in Test Mode** — Test sending DMs right from the dashboard without waiting for real comments.
- ☁️ **Vercel & Upstash Ready** — Zero server maintenance, serverless edge ready, using Upstash Redis / Vercel KV.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Premium dark glassmorphism design system in pure Vanilla CSS
- **Data Layer**: Upstash Redis / Vercel KV (with in-memory fallback for immediate zero-config local testing)
- **API**: Instagram Graph API v18.0 & Meta Webhooks

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone <repo-url>
cd InstaDMautomations
npm install
```

### 2. Configure Environment (Optional for local testing)
```bash
cp .env.example .env.local
```
*(If left empty locally, the app will automatically use an in-memory store so you can test the UI and logic immediately.)*

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. **Push to GitHub / GitLab**.
2. **Import project on [Vercel](https://vercel.com)**.
3. **Add Upstash Redis Storage**:
   - In your Vercel Project Dashboard → **Storage** tab → **Create Database** → Select **KV (Upstash)**.
   - Vercel automatically binds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your project environment variables.
   - *(Alternatively, if using an existing Upstash Redis database, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Project Settings → Environment Variables).*
4. **Deploy**!

---

## 📋 Meta Developer App & Instagram Setup Guide

For a full interactive walkthrough with copyable permission lists and troubleshooting, visit the `/docs` page in the dashboard.

### Step 0: Instagram Account Prerequisites (Must-Do)
1. Ensure your Instagram account is a **Professional Account (Creator or Business)**.
2. Connect your Instagram account to a **Facebook Page** (Facebook Page Settings → Linked Accounts → Instagram → Connect).
3. **Crucial Setting**: In Instagram mobile app → **Settings & Privacy** → **Messages and story replies** → **Message controls** → **Connected tools** → Turn **ON** *"Allow access to messages"*. (Without this, automated DMs fail with Meta error #230).

### Step 1: Create a Meta Developer App & Get App Secret
1. Go to [developers.facebook.com](https://developers.facebook.com) and click **Create App**.
2. Select **Other** → **Business** as the app type.
3. Name your app (e.g. `My Automation Tool` — *do not* use "Instagram" or "Meta" in the name).
4. Add the **Instagram Graph API** and **Webhooks** products.
5. In **App settings** → **Basic**, copy your **App ID** and click **Show** to copy your **App Secret**.

### Step 2: Generate a Long-Lived Page Access Token & Find IG User ID
1. Open the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. In the top-right toolbar: Change the **Meta App** dropdown from "Graph API Explorer" to **YOUR newly created App**.
3. Add required permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_messaging`
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_insights` (if follow-gating)
4. Click **Generate Access Token**, select both your Facebook Page and linked Instagram account, and approve permissions.
5. In the top-right dropdown, switch from **User Token** to **YOUR Page Access Token**.
6. **Extend Token (Never-Expiring / 60-Day)**: Click the **ⓘ** info icon next to the token → Click **Open in Access Token Tool** → Click **Extend Access Token** at the bottom → Copy this extended token.
7. **Find IG User ID**: In Graph API Explorer query bar, call `me?fields=id,name,instagram_business_account` → Submit. Copy the `instagram_business_account.id` value (or leave blank in onboarding to auto-fetch).

### Step 3: Webhook Configuration
1. In Meta Developer App → **Instagram** → **Webhooks**:
   - **Callback URL**: `https://<your-vercel-domain>.vercel.app/api/webhook`
   - **Verify Token**: Copy the token generated for your page in the Onboard wizard or Page Settings screen.
2. Under Webhook Subscriptions, click **Subscribe** to the `comments` field.
3. Switch automation toggle to ON in your InstaDM dashboard and you're live! 🚀

---

## 🔒 Security & Privacy

This application is designed specifically for **personal and brand-owned accounts**:
- Sensitive tokens are stored safely in your private Redis database and masked with `***` on the client.
- Webhook endpoints verify Meta challenge tokens and HMAC-SHA256 signatures.
- No public multi-tenant data exposure.
