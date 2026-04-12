/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */
import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_CMS_API_URL ?? 'http://localhost:4000';

// ── API Client ────────────────────────────────────────────────────────────────

let authToken = localStorage.getItem('cms_token') ?? '';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string; code: string; points: number; desc: string;
  active: boolean; usedCount: number; createdAt: string;
}

interface Announcement {
  id: string; title: string; content: string;
  active: boolean; createdAt: string;
}

interface FeatureFlag {
  key: string; enabled: boolean; desc: string;
}

type Page = 'login' | 'coupons' | 'announcements' | 'flags';

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { token } = await api<{ token: string }>('POST', '/auth/login', { email, password });
      authToken = token;
      localStorage.setItem('cms_token', token);
      onLogin();
    } catch {
      setError('登入失敗，請確認帳號密碼');
    }
  }

  return (
    <div style={styles.loginRoot}>
      <form onSubmit={handleLogin} style={styles.loginCard}>
        <h1 style={styles.loginTitle}>PairMaker CMS</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input style={styles.input} type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="密碼"
          value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" style={styles.btn}>登入</button>
      </form>
    </div>
  );
}

// ── Coupons Page ──────────────────────────────────────────────────────────────

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code,    setCode]    = useState('');
  const [points,  setPoints]  = useState('');
  const [desc,    setDesc]    = useState('');

  useEffect(() => { api<Coupon[]>('GET', '/coupons').then(setCoupons); }, []);

  async function addCoupon() {
    if (!code || !points) return;
    const c = await api<Coupon>('POST', '/coupons', { code, points: parseInt(points), desc });
    setCoupons(prev => [...prev, c]);
    setCode(''); setPoints(''); setDesc('');
  }

  async function toggleCoupon(id: string, active: boolean) {
    await api('PATCH', `/coupons/${id}`, { active: !active });
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
  }

  async function deleteCoupon(id: string) {
    if (!confirm('確定刪除此優惠券？')) return;
    await api('DELETE', `/coupons/${id}`);
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div>
      <h2>優惠券管理</h2>
      <div style={styles.formRow}>
        <input style={styles.input} placeholder="優惠碼" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
        <input style={styles.input} placeholder="積分" type="number" value={points} onChange={e => setPoints(e.target.value)} />
        <input style={styles.input} placeholder="說明" value={desc} onChange={e => setDesc(e.target.value)} />
        <button style={styles.btn} onClick={addCoupon}>新增</button>
      </div>
      <table style={styles.table}>
        <thead><tr><th>代碼</th><th>積分</th><th>說明</th><th>使用次數</th><th>狀態</th><th>操作</th></tr></thead>
        <tbody>
          {coupons.map(c => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.points}</td>
              <td>{c.desc}</td>
              <td>{c.usedCount}</td>
              <td>{c.active ? '✅ 啟用' : '❌ 停用'}</td>
              <td>
                <button style={styles.smallBtn} onClick={() => toggleCoupon(c.id, c.active)}>
                  {c.active ? '停用' : '啟用'}
                </button>
                <button style={{ ...styles.smallBtn, background: '#ff4444' }} onClick={() => deleteCoupon(c.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Announcements Page ────────────────────────────────────────────────────────

function AnnouncementsPage() {
  const [items,   setItems]   = useState<Announcement[]>([]);
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');

  useEffect(() => { api<Announcement[]>('GET', '/announcements/all').then(setItems); }, []);

  async function addAnn() {
    if (!title || !content) return;
    const a = await api<Announcement>('POST', '/announcements', { title, content });
    setItems(prev => [...prev, a]);
    setTitle(''); setContent('');
  }

  async function toggleAnn(id: string, active: boolean) {
    await api('PATCH', `/announcements/${id}`, { active: !active });
    setItems(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a));
  }

  return (
    <div>
      <h2>公告管理</h2>
      <div style={styles.formRow}>
        <input style={styles.input} placeholder="標題" value={title} onChange={e => setTitle(e.target.value)} />
        <input style={styles.input} placeholder="內容" value={content} onChange={e => setContent(e.target.value)} />
        <button style={styles.btn} onClick={addAnn}>新增</button>
      </div>
      <table style={styles.table}>
        <thead><tr><th>標題</th><th>內容</th><th>狀態</th><th>建立時間</th><th>操作</th></tr></thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.content}</td>
              <td>{a.active ? '✅' : '❌'}</td>
              <td>{a.createdAt.substring(0, 10)}</td>
              <td>
                <button style={styles.smallBtn} onClick={() => toggleAnn(a.id, a.active)}>
                  {a.active ? '隱藏' : '顯示'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Feature Flags Page ────────────────────────────────────────────────────────

function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  useEffect(() => { api<FeatureFlag[]>('GET', '/feature-flags').then(setFlags); }, []);

  async function toggle(key: string, enabled: boolean) {
    await api('PATCH', `/feature-flags/${key}`, { enabled: !enabled });
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !enabled } : f));
  }

  return (
    <div>
      <h2>功能開關</h2>
      <table style={styles.table}>
        <thead><tr><th>Key</th><th>說明</th><th>狀態</th><th>操作</th></tr></thead>
        <tbody>
          {flags.map(f => (
            <tr key={f.key}>
              <td><code>{f.key}</code></td>
              <td>{f.desc}</td>
              <td>{f.enabled ? '✅ 啟用' : '❌ 停用'}</td>
              <td>
                <button style={styles.smallBtn} onClick={() => toggle(f.key, f.enabled)}>
                  {f.enabled ? '停用' : '啟用'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page,         setPage]         = useState<Page>(authToken ? 'coupons' : 'login');
  const [isLoggedIn,   setIsLoggedIn]   = useState(!!authToken);

  function handleLogin() {
    setIsLoggedIn(true);
    setPage('coupons');
  }

  function handleLogout() {
    authToken = '';
    localStorage.removeItem('cms_token');
    setIsLoggedIn(false);
    setPage('login');
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  const navItems: { label: string; page: Page }[] = [
    { label: '優惠券', page: 'coupons' },
    { label: '公告',   page: 'announcements' },
    { label: '功能開關', page: 'flags' },
  ];

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <span style={styles.navBrand}>PairMaker CMS</span>
        <div>
          {navItems.map(n => (
            <button
              key={n.page}
              style={{ ...styles.navBtn, ...(page === n.page ? styles.navBtnActive : {}) }}
              onClick={() => setPage(n.page)}
            >
              {n.label}
            </button>
          ))}
          <button style={{ ...styles.navBtn, marginLeft: 16, color: '#ff4444' }} onClick={handleLogout}>
            登出
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        {page === 'coupons'       && <CouponsPage />}
        {page === 'announcements' && <AnnouncementsPage />}
        {page === 'flags'         && <FeatureFlagsPage />}
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root:        { fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f5f5f5' },
  loginRoot:   { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FF6B6B' },
  loginCard:   { background: '#fff', padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, width: 320 },
  loginTitle:  { textAlign: 'center', color: '#FF6B6B', margin: 0, marginBottom: 8 },
  nav:         { background: '#fff', borderBottom: '1px solid #eee', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBrand:    { fontWeight: 700, color: '#FF6B6B', fontSize: 18 },
  navBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 14 },
  navBtnActive:{ color: '#FF6B6B', fontWeight: 700, borderBottom: '2px solid #FF6B6B' },
  main:        { padding: 24, maxWidth: 1200, margin: '0 auto' },
  formRow:     { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  input:       { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
  btn:         { padding: '8px 16px', background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  smallBtn:    { padding: '4px 8px', background: '#666', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginRight: 4 },
  table:       { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' },
};
