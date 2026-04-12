/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * PairMaker CMS Backend
 * Express + lowdb (JSON file DB) — 輕量級 CMS 後端
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import * as path from 'path';
import * as fs from 'fs';

const PORT = parseInt(process.env.CMS_PORT ?? '4000', 10);
const DB_PATH = process.env.CMS_DB_PATH ?? path.join(__dirname, '../../data/db.json');

// JWT_SECRET 必須明確設定 —— 使用預設值會造成嚴重安全漏洞
if (!process.env.CMS_JWT_SECRET) {
  console.error('❌ 啟動失敗：CMS_JWT_SECRET 環境變數未設定。請在 .env 設定強密碼後再啟動。');
  process.exit(1);
}
const JWT_SECRET = process.env.CMS_JWT_SECRET;

// ── 資料庫初始化 ──────────────────────────────────────────────────────────────

interface DBSchema {
  admins: Array<{ id: string; email: string; passwordHash: string; role: string }>;
  coupons: Array<{
    id: string; code: string; points: number; desc: string;
    active: boolean; usedCount: number; createdAt: string;
  }>;
  announcements: Array<{
    id: string; title: string; content: string;
    active: boolean; createdAt: string;
  }>;
  featureFlags: Array<{ key: string; enabled: boolean; desc: string }>;
}

const defaultData: DBSchema = {
  admins: [],
  coupons: [],
  announcements: [],
  featureFlags: [
    { key: 'ai_photo_analysis', enabled: true,  desc: 'AI 顏值分析功能' },
    { key: 'couple_mode',       enabled: true,  desc: '情侶模式' },
    { key: 'deep_links',        enabled: true,  desc: 'Deep Link 功能' },
  ],
};

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const adapter = new JSONFile<DBSchema>(DB_PATH);
const db      = new Low<DBSchema>(adapter, defaultData);

// ── Auth Middleware ───────────────────────────────────────────────────────────

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const token   = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { adminId: string; role: string };
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CMS_CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Auth Routes ───────────────────────────────────────────────────────────────

app.post('/auth/login', async (req, res) => {
  await db.read();
  const { email, password } = req.body as { email: string; password: string };
  const admin = db.data.admins.find(a => a.email === email);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ adminId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: admin.role });
});

app.post('/auth/register-first-admin', async (req, res) => {
  await db.read();
  if (db.data.admins.length > 0) {
    res.status(403).json({ error: 'Admin already exists' });
    return;
  }
  const { email, password } = req.body as { email: string; password: string };
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = { id: `admin_${Date.now()}`, email, passwordHash, role: 'super' };
  db.data.admins.push(admin);
  await db.write();
  res.status(201).json({ message: 'First admin created' });
});

// ── Coupon Routes ─────────────────────────────────────────────────────────────

app.get('/coupons', authMiddleware, async (_req, res) => {
  await db.read();
  res.json(db.data.coupons.map(c => ({ ...c, passwordHash: undefined })));
});

app.post('/coupons', authMiddleware, async (req, res) => {
  await db.read();
  const { code, points, desc } = req.body as { code: string; points: number; desc: string };
  const coupon = {
    id: `cp_${Date.now()}`, code: code.toUpperCase(), points, desc,
    active: true, usedCount: 0, createdAt: new Date().toISOString(),
  };
  db.data.coupons.push(coupon);
  await db.write();
  res.status(201).json(coupon);
});

app.patch('/coupons/:id', authMiddleware, async (req, res) => {
  await db.read();
  const coupon = db.data.coupons.find(c => c.id === req.params.id);
  if (!coupon) { res.status(404).json({ error: 'Not found' }); return; }
  Object.assign(coupon, req.body);
  await db.write();
  res.json(coupon);
});

app.delete('/coupons/:id', authMiddleware, async (req, res) => {
  await db.read();
  db.data.coupons = db.data.coupons.filter(c => c.id !== req.params.id);
  await db.write();
  res.status(204).send();
});

// ── Announcement Routes ───────────────────────────────────────────────────────

app.get('/announcements', async (_req, res) => {
  await db.read();
  res.json(db.data.announcements.filter(a => a.active));
});

app.get('/announcements/all', authMiddleware, async (_req, res) => {
  await db.read();
  res.json(db.data.announcements);
});

app.post('/announcements', authMiddleware, async (req, res) => {
  await db.read();
  const { title, content } = req.body as { title: string; content: string };
  const ann = {
    id: `ann_${Date.now()}`, title, content,
    active: true, createdAt: new Date().toISOString(),
  };
  db.data.announcements.push(ann);
  await db.write();
  res.status(201).json(ann);
});

app.patch('/announcements/:id', authMiddleware, async (req, res) => {
  await db.read();
  const ann = db.data.announcements.find(a => a.id === req.params.id);
  if (!ann) { res.status(404).json({ error: 'Not found' }); return; }
  Object.assign(ann, req.body);
  await db.write();
  res.json(ann);
});

// ── Feature Flags Routes ──────────────────────────────────────────────────────

app.get('/feature-flags', async (_req, res) => {
  await db.read();
  res.json(db.data.featureFlags);
});

app.patch('/feature-flags/:key', authMiddleware, async (req, res) => {
  await db.read();
  const flag = db.data.featureFlags.find(f => f.key === req.params.key);
  if (!flag) { res.status(404).json({ error: 'Not found' }); return; }
  flag.enabled = req.body.enabled ?? flag.enabled;
  await db.write();
  res.json(flag);
});

// ── Start ─────────────────────────────────────────────────────────────────────

db.read().then(() => {
  app.listen(PORT, () => {
    console.log(`CMS Backend running on http://localhost:${PORT}`);
  });
});
