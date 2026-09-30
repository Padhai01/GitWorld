import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from '../utils/db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';
import { getTierFromStars, getTerritorySize } from '../utils/battleEngine.js';

const router = Router();

function sanitize(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, password required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = getDb();
    const existing = await db('users').where('username', username).orWhere('email', email).first();
    if (existing) return res.status(409).json({ error: 'Username or email already taken' });

    const id = uuid();
    const hash = await bcrypt.hash(password, 10);
    const x = (Math.random() - 0.5) * 340;
    const y = (Math.random() - 0.5) * 160;
    const protectedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db('users').insert({
      id, username, email, password_hash: hash,
      territory_x: x, territory_y: y,
      territory_name: `${username}'s Territory`,
      is_protected: 1, protected_until: protectedUntil,
    });

    const user = await db('users').where('id', id).first();
    const token = signToken({ id: user.id, username: user.username });
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    const user = await db('users').where('username', username).orWhere('email', username).first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, user: sanitize(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const user = await db('users').where('id', req.user.id).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitize(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { territory_name, territory_color, biome, capital_repo, bio } = req.body;
    const db = getDb();
    const update = {};
    if (territory_name  !== undefined) update.territory_name  = territory_name;
    if (territory_color !== undefined) update.territory_color = territory_color;
    if (biome           !== undefined) update.biome           = biome;
    if (capital_repo    !== undefined) update.capital_repo    = capital_repo;
    if (bio             !== undefined) update.bio             = bio;
    update.updated_at = new Date().toISOString();
    await db('users').where('id', req.user.id).update(update);
    const user = await db('users').where('id', req.user.id).first();
    res.json({ user: sanitize(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
