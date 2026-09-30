import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../utils/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { computePowerScore, getTierFromStars, getTerritorySize } from '../utils/battleEngine.js';

const router = Router();

async function recalcUserStars(db, userId) {
  const result = await db('repositories').where('user_id', userId).sum('stars as total');
  const totalStars = result[0].total || 0;
  await db('users').where('id', userId).update({
    total_stars: totalStars,
    tier: getTierFromStars(totalStars),
    territory_size: getTerritorySize(totalStars),
    updated_at: new Date().toISOString()
  });
  return totalStars;
}

// GET /api/repos/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const repos = await db('repositories').where('user_id', req.params.userId).orderBy('power_score', 'desc');
    res.json({ repos });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/repos
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, stars, forks, commits, open_issues, closed_issues, contributors, language } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const db = getDb();
    const existing = await db('repositories').where({ user_id: req.user.id, name }).first();
    if (existing) return res.status(409).json({ error: 'Repo already exists' });

    const repoData = {
      stars: Number(stars) || 0, forks: Number(forks) || 0,
      commits: Number(commits) || 0, open_issues: Number(open_issues) || 0,
      closed_issues: Number(closed_issues) || 0, contributors: Number(contributors) || 1,
    };
    const power_score = computePowerScore(repoData);
    const id = uuid();

    await db('repositories').insert({
      id, user_id: req.user.id, name, description,
      ...repoData, language, power_score, is_public: 1
    });
    await recalcUserStars(db, req.user.id);
    const repo = await db('repositories').where('id', id).first();
    res.status(201).json({ repo });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/repos/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const repo = await db('repositories').where('id', req.params.id).first();
    if (!repo) return res.status(404).json({ error: 'Not found' });
    if (repo.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = {
      stars:         Number(req.body.stars)         ?? repo.stars,
      forks:         Number(req.body.forks)         ?? repo.forks,
      commits:       Number(req.body.commits)       ?? repo.commits,
      open_issues:   Number(req.body.open_issues)   ?? repo.open_issues,
      closed_issues: Number(req.body.closed_issues) ?? repo.closed_issues,
      contributors:  Number(req.body.contributors)  ?? repo.contributors,
    };
    const power_score = computePowerScore(updated);

    await db('repositories').where('id', repo.id).update({
      ...updated,
      description: req.body.description ?? repo.description,
      power_score,
      updated_at: new Date().toISOString()
    });
    await recalcUserStars(db, req.user.id);
    const updatedRepo = await db('repositories').where('id', repo.id).first();
    res.json({ repo: updatedRepo });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/repos/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const repo = await db('repositories').where('id', req.params.id).first();
    if (!repo) return res.status(404).json({ error: 'Not found' });
    if (repo.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db('repositories').where('id', repo.id).delete();
    await recalcUserStars(db, req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
