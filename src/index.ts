import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { hashPassword, verifyPassword, createJWT, verifyJWT } from './auth';

type Vars = { userId: string; isAdmin: boolean; userName: string };

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.use('/api/*', cors({ origin: '*' }));

// Auth middleware
const auth = async (c: any, next: any) => {
  const header = c.req.header('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const payload = await verifyJWT(header.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);
  c.set('userId', payload.id);
  c.set('isAdmin', payload.is_admin === 1);
  c.set('userName', payload.name);
  await next();
};

const adminOnly = async (c: any, next: any) => {
  if (!c.get('isAdmin')) return c.json({ error: 'Forbidden' }, 403);
  await next();
};

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- AUTH ---

app.post('/api/auth/register', async (c) => {
  const { email, password, name, phone, role, qualifications } = await c.req.json();
  if (!email || !password || !name || !phone || !role) return c.json({ error: 'Missing required fields' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM responders WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare(
    'INSERT INTO responders (id, email, name, phone, role, qualifications, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email.toLowerCase(), name, phone, role, JSON.stringify(qualifications || []), passwordHash).run();

  const token = await createJWT({ id, email: email.toLowerCase(), name, role, is_admin: 0 }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, email: email.toLowerCase(), name, phone, role, qualifications: qualifications || [], is_admin: 0, is_verified: 0, is_available: 0 } }, 201);
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

  const row = await c.env.DB.prepare('SELECT * FROM responders WHERE email = ?').bind(email.toLowerCase()).first<any>();
  if (!row || !(await verifyPassword(password, row.password_hash))) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await createJWT({ id: row.id, email: row.email, name: row.name, role: row.role, is_admin: row.is_admin }, c.env.JWT_SECRET);
  const { password_hash, ...user } = row;
  user.qualifications = JSON.parse(user.qualifications || '[]');
  return c.json({ token, user });
});

// --- RESPONDER ---

app.get('/api/responders/me', auth, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM responders WHERE id = ?').bind(c.get('userId')).first<any>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  const { password_hash, ...user } = row;
  user.qualifications = JSON.parse(user.qualifications || '[]');
  return c.json(user);
});

app.put('/api/responders/me', auth, async (c) => {
  const { name, phone, qualifications } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE responders SET name = ?, phone = ?, qualifications = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(name, phone, JSON.stringify(qualifications || []), c.get('userId')).run();
  return c.json({ ok: true });
});

app.put('/api/responders/me/status', auth, async (c) => {
  const { is_available } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE responders SET is_available = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(is_available ? 1 : 0, c.get('userId')).run();
  return c.json({ ok: true, is_available: is_available ? 1 : 0 });
});

app.put('/api/responders/me/location', auth, async (c) => {
  const { latitude, longitude } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE responders SET latitude = ?, longitude = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(latitude, longitude, c.get('userId')).run();
  return c.json({ ok: true });
});

app.get('/api/responders/me/incidents', auth, async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT i.*, r.status AS response_status, r.id AS response_id
    FROM incidents i
    JOIN responses r ON r.incident_id = i.id
    WHERE r.responder_id = ? AND i.status = 'active'
    ORDER BY i.created_at DESC
  `).bind(c.get('userId')).all();
  return c.json(rows.results);
});

// --- INCIDENTS ---

app.get('/api/incidents', auth, async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT i.*,
      (SELECT COUNT(*) FROM responses WHERE incident_id = i.id AND status IN ('accepted','arrived')) AS responder_count,
      (SELECT status FROM responses WHERE incident_id = i.id AND responder_id = ?) AS my_response
    FROM incidents i
    WHERE i.status = 'active'
    ORDER BY i.created_at DESC
  `).bind(c.get('userId')).all();
  return c.json(rows.results);
});

app.get('/api/incidents/all', auth, adminOnly, async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT i.*,
      (SELECT COUNT(*) FROM responses WHERE incident_id = i.id) AS total_notified,
      (SELECT COUNT(*) FROM responses WHERE incident_id = i.id AND status IN ('accepted','arrived')) AS responder_count
    FROM incidents i
    ORDER BY i.created_at DESC LIMIT 200
  `).all();
  return c.json(rows.results);
});

app.get('/api/incidents/:id', auth, async (c) => {
  const row = await c.env.DB.prepare(`
    SELECT i.*,
      (SELECT COUNT(*) FROM responses WHERE incident_id = i.id AND status IN ('accepted','arrived')) AS responder_count,
      (SELECT status FROM responses WHERE incident_id = i.id AND responder_id = ?) AS my_response
    FROM incidents i WHERE i.id = ?
  `).bind(c.get('userId'), c.req.param('id')).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

app.post('/api/incidents', auth, async (c) => {
  const { reported_by, type, latitude, longitude, address, description } = await c.req.json();
  if (!type || latitude == null || longitude == null) return c.json({ error: 'type, latitude, longitude required' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO incidents (id, reported_by, type, latitude, longitude, address, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, reported_by || 'Anonymous', type, latitude, longitude, address || '', description || '').run();

  // Notify available responders within 5km
  const allAvailable = await c.env.DB.prepare(
    'SELECT id, latitude, longitude FROM responders WHERE is_available = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL'
  ).all<any>();

  const nearby = allAvailable.results.filter((r: any) => haversine(latitude, longitude, r.latitude, r.longitude) <= 5);

  if (nearby.length > 0) {
    const stmt = c.env.DB.prepare('INSERT INTO responses (id, incident_id, responder_id) VALUES (?, ?, ?)');
    await c.env.DB.batch(nearby.map((r: any) => stmt.bind(crypto.randomUUID(), id, r.id)));
  }

  return c.json({ id, notified: nearby.length }, 201);
});

app.post('/api/incidents/:id/respond', auth, async (c) => {
  const userId = c.get('userId');
  const incidentId = c.req.param('id');
  const { status } = await c.req.json(); // accepted | declined | arrived | completed

  const existing = await c.env.DB.prepare(
    'SELECT id FROM responses WHERE incident_id = ? AND responder_id = ?'
  ).bind(incidentId, userId).first<any>();

  if (existing) {
    const extra = status === 'arrived' ? ", arrived_at = datetime('now')" : '';
    await c.env.DB.prepare(
      `UPDATE responses SET status = ?, responded_at = datetime('now')${extra} WHERE incident_id = ? AND responder_id = ?`
    ).bind(status, incidentId, userId).run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO responses (id, incident_id, responder_id, status, responded_at) VALUES (?, ?, ?, ?, datetime('now'))"
    ).bind(crypto.randomUUID(), incidentId, userId, status).run();
  }
  return c.json({ ok: true });
});

app.put('/api/incidents/:id/resolve', auth, adminOnly, async (c) => {
  await c.env.DB.prepare(
    "UPDATE incidents SET status = 'resolved', updated_at = datetime('now') WHERE id = ?"
  ).bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

app.put('/api/incidents/:id/cancel', auth, adminOnly, async (c) => {
  await c.env.DB.prepare(
    "UPDATE incidents SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?"
  ).bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

// --- AEDs ---

app.get('/api/aeds', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM aed_locations ORDER BY name').all();
  return c.json(rows.results);
});

app.post('/api/aeds', auth, async (c) => {
  const { name, address, latitude, longitude } = await c.req.json();
  if (!name || !address || latitude == null || longitude == null) return c.json({ error: 'All fields required' }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO aed_locations (id, name, address, latitude, longitude, added_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, name, address, latitude, longitude, c.get('userId')).run();
  return c.json({ id }, 201);
});

// --- ADMIN ---

app.get('/api/admin/stats', auth, adminOnly, async (c) => {
  const [total, active, incidents, activeInc, responded] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM responders').first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM responders WHERE is_available = 1').first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM incidents').first<any>(),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM incidents WHERE status = 'active'").first<any>(),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM responses WHERE status IN ('accepted','arrived')").first<any>(),
  ]);
  return c.json({
    totalResponders: total?.n ?? 0,
    activeResponders: active?.n ?? 0,
    totalIncidents: incidents?.n ?? 0,
    activeIncidents: activeInc?.n ?? 0,
    totalResponded: responded?.n ?? 0,
  });
});

app.get('/api/admin/responders', auth, adminOnly, async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, email, name, phone, role, qualifications, is_available, is_verified, is_admin, latitude, longitude, created_at FROM responders ORDER BY created_at DESC'
  ).all<any>();
  const results = rows.results.map(r => ({ ...r, qualifications: JSON.parse(r.qualifications || '[]') }));
  return c.json(results);
});

app.put('/api/admin/responders/:id/verify', auth, adminOnly, async (c) => {
  const { is_verified } = await c.req.json();
  await c.env.DB.prepare('UPDATE responders SET is_verified = ? WHERE id = ?').bind(is_verified ? 1 : 0, c.req.param('id')).run();
  return c.json({ ok: true });
});

app.put('/api/admin/responders/:id/admin', auth, adminOnly, async (c) => {
  const { is_admin } = await c.req.json();
  await c.env.DB.prepare('UPDATE responders SET is_admin = ? WHERE id = ?').bind(is_admin ? 1 : 0, c.req.param('id')).run();
  return c.json({ ok: true });
});

// Bootstrap: grant admin by email using the ADMIN_KEY secret
app.post('/api/admin/bootstrap', async (c) => {
  const { email, admin_key } = await c.req.json();
  if (!admin_key || admin_key !== c.env.ADMIN_KEY) return c.json({ error: 'Wrong key' }, 403);
  const result = await c.env.DB.prepare('UPDATE responders SET is_admin = 1 WHERE email = ?').bind(email.toLowerCase()).run();
  if (!result.meta.changes) return c.json({ error: 'User not found' }, 404);
  return c.json({ ok: true, message: `${email} is now admin` });
});

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// SPA fallback
app.all('*', async (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
