import { Router } from 'express';
import { getDb } from '../utils/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getTierFromStars, getTerritorySize } from '../utils/battleEngine.js';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { tier, limit = 50, offset = 0 } = req.query;
    let query = db('users').select(
      'id','username','avatar_url','total_stars','tier','territory_size',
      'territory_color','territory_name','territory_x','territory_y','biome',
      'wars_won','wars_lost','plan','is_protected','created_at'
    ).orderBy('total_stars', 'desc').limit(Number(limit)).offset(Number(offset));
    if (tier) query = query.where('tier', tier);
    const users = await query;
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/globe
router.get('/globe', async (req, res) => {
  try {
    const db = getDb();
    const users = await db('users').select(
      'id','username','avatar_url','total_stars','tier','territory_size',
      'territory_color','territory_name','territory_x','territory_y','biome',
      'wars_won','wars_lost','is_protected','capital_repo'
    ).orderBy('total_stars', 'desc');
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:username
router.get('/:username', async (req, res) => {
  try {
    const db = getDb();
    const user = await db('users').select(
      'id','username','avatar_url','bio','total_stars','tier','territory_size',
      'territory_color','territory_name','territory_x','territory_y','biome',
      'wars_won','wars_lost','plan','capital_repo','is_protected','created_at'
    ).where('username', req.params.username).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const repos = await db('repositories').where('user_id', user.id).orderBy('power_score', 'desc');

    const recentWars = await db('wars as w')
      .join('users as a', 'w.attacker_id', 'a.id')
      .join('users as d', 'w.defender_id', 'd.id')
      .leftJoin('repositories as ar', 'w.attacker_repo_id', 'ar.id')
      .leftJoin('repositories as dr', 'w.defender_repo_id', 'dr.id')
      .select('w.*',
        'a.username as attacker_name', 'a.territory_color as attacker_color',
        'd.username as defender_name', 'd.territory_color as defender_color',
        'ar.name as attacker_repo_name', 'dr.name as defender_repo_name'
      )
      .where(function() {
        this.where('w.attacker_id', user.id).orWhere('w.defender_id', user.id);
      })
      .andWhere('w.status', 'completed')
      .orderBy('w.completed_at', 'desc').limit(5);

    res.json({ user, repos, recentWars });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users/:username/add-stars
router.post('/:username/add-stars', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { amount = 100 } = req.body;
    const user = await db('users').where('username', req.params.username).first();
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const newStars = user.total_stars + Number(amount);
    const newTier  = getTierFromStars(newStars);
    const newSize  = getTerritorySize(newStars);
    await db('users').where('id', user.id).update({
      total_stars: newStars, tier: newTier,
      territory_size: newSize, updated_at: new Date().toISOString()
    });
    res.json({ total_stars: newStars, tier: newTier, territory_size: newSize });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
