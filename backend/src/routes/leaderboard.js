import { Router } from 'express';
import { getDb } from '../utils/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const { category = 'territory' } = req.query;
    const db = getDb();
    let entries;
    switch (category) {
      case 'stars':
        entries = await db('users').select('username','avatar_url','total_stars as value','tier','territory_color').orderBy('total_stars','desc').limit(20);
        break;
      case 'wars_won':
        entries = await db('users').select('username','avatar_url','wars_won as value','tier','territory_color').orderBy('wars_won','desc').limit(20);
        break;
      case 'win_rate':
        entries = await db('users')
          .select('username','avatar_url','tier','territory_color',
            db.raw('CASE WHEN (wars_won+wars_lost)>0 THEN ROUND(wars_won*100.0/(wars_won+wars_lost),1) ELSE 0 END as value'))
          .where(db.raw('(wars_won+wars_lost) > 0'))
          .orderBy('value','desc').limit(20);
        break;
      default:
        entries = await db('users').select('username','avatar_url','territory_size as value','tier','territory_color').orderBy('territory_size','desc').limit(20);
    }
    res.json({ entries, category });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/leaderboard/globe-events
router.get('/globe-events', async (req, res) => {
  try {
    const db = getDb();
    const events = await db('globe_events as ge')
      .leftJoin('users as u', 'ge.user_id', 'u.id')
      .select('ge.*', 'u.username', 'u.territory_color')
      .orderBy('ge.occurred_at', 'desc').limit(20);
    res.json({ events });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/leaderboard/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const notifications = await db('notifications').where('user_id', req.user.id).orderBy('created_at','desc').limit(30);
    const [{ c: unread }] = await db('notifications').where({ user_id: req.user.id, is_read: 0 }).count('* as c');
    res.json({ notifications, unread });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/leaderboard/notifications/read-all
router.post('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    await db('notifications').where('user_id', req.user.id).update({ is_read: 1 });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
