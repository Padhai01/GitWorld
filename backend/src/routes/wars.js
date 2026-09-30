import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../utils/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { simulateBattle } from '../utils/battleEngine.js';

const router = Router();

const warJoin = (db) => db('wars as w')
  .join('users as a', 'w.attacker_id', 'a.id')
  .join('users as d', 'w.defender_id', 'd.id')
  .leftJoin('repositories as ar', 'w.attacker_repo_id', 'ar.id')
  .leftJoin('repositories as dr', 'w.defender_repo_id', 'dr.id')
  .select('w.*',
    'a.username as attacker_name', 'a.territory_color as attacker_color',
    'd.username as defender_name', 'd.territory_color as defender_color',
    'ar.name as attacker_repo_name', 'ar.stars as attacker_repo_stars',
    'dr.name as defender_repo_name', 'dr.stars as defender_repo_stars'
  );

// GET /api/wars
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    const db = getDb();
    let q = warJoin(db).orderBy('w.declared_at', 'desc').limit(Number(limit));
    if (status) q = q.where('w.status', status);
    res.json({ wars: await q });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/wars/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const wars = await warJoin(db)
      .where(function() {
        this.where('w.attacker_id', req.params.userId).orWhere('w.defender_id', req.params.userId);
      })
      .orderBy('w.declared_at', 'desc').limit(20);
    res.json({ wars });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/wars/declare
router.post('/declare', authMiddleware, async (req, res) => {
  try {
    const { defender_id, attacker_repo_id } = req.body;
    const db = getDb();
    if (req.user.id === defender_id)
      return res.status(400).json({ error: 'Cannot declare war on yourself' });

    const attacker = await db('users').where('id', req.user.id).first();
    const defender = await db('users').where('id', defender_id).first();
    if (!attacker || !defender) return res.status(404).json({ error: 'User not found' });

    if (defender.is_protected && defender.protected_until) {
      if (new Date(defender.protected_until) > new Date())
        return res.status(403).json({ error: 'Target is under newcomer protection' });
    }
    if (attacker.plan === 'free' && attacker.wars_this_month >= 2)
      return res.status(403).json({ error: 'Free plan: 2 wars/month limit reached. Upgrade to Warlord.' });

    const cooldown = await db('war_cooldowns').where({ attacker_id: req.user.id, defender_id }).first();
    if (cooldown) {
      const daysSince = (Date.now() - new Date(cooldown.last_war_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7)
        return res.status(429).json({ error: `War cooldown: ${Math.ceil(7 - daysSince)} days remaining` });
    }

    const repo = await db('repositories').where({ id: attacker_repo_id, user_id: req.user.id }).first();
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const warId = uuid();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await db('wars').insert({
      id: warId, attacker_id: req.user.id, defender_id,
      attacker_repo_id, status: 'pending', expires_at: expiresAt,
      declared_at: new Date().toISOString()
    });

    await db('notifications').insert({
      id: uuid(), user_id: defender_id, type: 'war_declared',
      title: '⚔️ War Declared!',
      body: `${attacker.username} declared war on you! Choose your champion repo.`,
      data: JSON.stringify({ war_id: warId, attacker: attacker.username }),
      created_at: new Date().toISOString()
    });

    const war = await db('wars').where('id', warId).first();
    res.status(201).json({ war });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/wars/:id/respond
router.post('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { defender_repo_id, accept } = req.body;
    const db = getDb();
    const war = await db('wars').where('id', req.params.id).first();
    if (!war) return res.status(404).json({ error: 'War not found' });
    if (war.defender_id !== req.user.id) return res.status(403).json({ error: 'Not your war' });
    if (war.status !== 'pending') return res.status(400).json({ error: 'War already resolved' });

    if (!accept) {
      await db('wars').where('id', war.id).update({ status: 'declined', responded_at: new Date().toISOString() });
      return res.json({ war: await db('wars').where('id', war.id).first() });
    }

    const defRepo = await db('repositories').where({ id: defender_repo_id, user_id: req.user.id }).first();
    if (!defRepo) return res.status(404).json({ error: 'Defender repository not found' });

    const attacker = await db('users').where('id', war.attacker_id).first();
    const defender = await db('users').where('id', war.defender_id).first();
    const attRepo  = await db('repositories').where('id', war.attacker_repo_id).first();

    const result   = simulateBattle(attRepo, defRepo, attacker, defender);
    const winnerId = result.winner === 'attacker' ? attacker.id : defender.id;
    const loserId  = result.winner === 'attacker' ? defender.id : attacker.id;
    const now      = new Date().toISOString();

    await db('wars').where('id', war.id).update({
      status: 'completed', defender_repo_id: defRepo.id, winner_id: winnerId,
      territory_gained: result.territoryGained, attacker_score: result.attackerScore,
      defender_score: result.defenderScore, battle_log: result.log,
      responded_at: now, completed_at: now
    });

    // Update territories
    await db('users').where('id', winnerId).update({
      territory_size: db.raw('territory_size + ?', [result.territoryGained]),
      wars_won: db.raw('wars_won + 1'), updated_at: now
    });
    await db('users').where('id', loserId).update({
      territory_size: db.raw('MAX(0.001, territory_size - ?)', [result.territoryGained]),
      wars_lost: db.raw('wars_lost + 1'), updated_at: now
    });
    await db('users').where('id', war.attacker_id).update({
      wars_this_month: db.raw('wars_this_month + 1')
    });

    // Cooldown
    await db('war_cooldowns')
      .insert({ attacker_id: war.attacker_id, defender_id: war.defender_id, last_war_at: now })
      .onConflict(['attacker_id','defender_id']).merge();

    // Globe event
    const winner = result.winner === 'attacker' ? attacker : defender;
    const loser  = result.winner === 'attacker' ? defender : attacker;
    await db('globe_events').insert({
      id: uuid(), type: 'war_result', user_id: winnerId,
      description: `${winner.username} defeated ${loser.username} in battle!`,
      data: JSON.stringify({ war_id: war.id, territory_gained: result.territoryGained }),
      occurred_at: now
    });

    // Notifications
    await db('notifications').insert([
      { id: uuid(), user_id: winnerId, type: 'war_result', title: '⚔️ Victory!',
        body: `You defeated ${loser.username} and gained ${result.territoryGained.toFixed(3)}% territory!`,
        data: JSON.stringify({ war_id: war.id }), created_at: now },
      { id: uuid(), user_id: loserId, type: 'war_result', title: '⚔️ Defeat',
        body: `${winner.username} conquered part of your territory.`,
        data: JSON.stringify({ war_id: war.id }), created_at: now }
    ]);

    res.json({
      war: await db('wars').where('id', war.id).first(),
      result: {
        winner: result.winner, attackerScore: result.attackerScore,
        defenderScore: result.defenderScore, territoryGained: result.territoryGained,
        rounds: result.rounds
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
