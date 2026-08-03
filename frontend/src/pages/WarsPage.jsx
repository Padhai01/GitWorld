import React, { useEffect, useState, useRef } from 'react';
import { warsApi, usersApi, reposApi } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

/* ═══════════════════════════════════════════════════════════
   BGMI-STYLE WAR ROOM — GitWorld Battle Arena
   ═══════════════════════════════════════════════════════════ */

const BGMI_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;700;800&family=Share+Tech+Mono&display=swap');

  .bgmi-root {
    --orange:  #ff6b00;
    --yellow:  #ffd000;
    --red:     #ff1a1a;
    --green:   #00ff88;
    --blue:    #00cfff;
    --dark:    #080c10;
    --panel:   #0d1520;
    --border:  #1e3a5f;
    --kill:    #ff4444;
    font-family: 'Exo 2', sans-serif;
    background: var(--dark);
    min-height: 100%;
  }

  /* HUD top bar */
  .bgmi-hud {
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(8,12,16,0.9) 100%);
    border-bottom: 2px solid var(--orange);
    padding: 0.6rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  .bgmi-hud::before {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(90deg,
      transparent, transparent 40px,
      rgba(255,107,0,0.03) 40px, rgba(255,107,0,0.03) 41px);
  }
  .bgmi-title {
    font-family: 'Orbitron', monospace;
    font-size: 1.4rem; font-weight: 900;
    background: linear-gradient(90deg, #ff6b00, #ffd000);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: 0.15em;
    text-shadow: none;
    filter: drop-shadow(0 0 10px rgba(255,107,0,0.5));
  }
  .bgmi-subtitle {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; color: rgba(255,107,0,0.6);
    letter-spacing: 0.3em; margin-top: 2px;
  }
  .bgmi-stat-pill {
    background: rgba(255,107,0,0.1);
    border: 1px solid rgba(255,107,0,0.3);
    padding: 0.3rem 0.8rem;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.7rem; color: var(--orange);
    display: flex; align-items: center; gap: 0.4rem;
  }

  /* Zone ring animation */
  @keyframes zoneRing {
    0%   { transform: scale(1);   opacity: 0.7; }
    50%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1);   opacity: 0.7; }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes bulletFly {
    0%   { transform: translateX(-100px); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(100vw); opacity: 0; }
  }
  @keyframes explosion {
    0%   { transform: scale(0); opacity: 1; }
    50%  { transform: scale(1.5); opacity: 0.8; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes healthDrain {
    from { width: 100%; }
    to   { width: var(--target-width); }
  }
  @keyframes killFeed {
    0%   { opacity: 0; transform: translateX(40px); }
    10%  { opacity: 1; transform: translateX(0); }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes countDown {
    0%   { transform: scale(2); opacity: 0; }
    20%  { transform: scale(1); opacity: 1; }
    80%  { transform: scale(1); opacity: 1; }
    100% { transform: scale(0.5); opacity: 0; }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25%     { transform: translateX(-8px); }
    75%     { transform: translateX(8px); }
  }
  @keyframes bgmiPulse {
    0%,100% { box-shadow: 0 0 20px rgba(255,107,0,0.3); }
    50%     { box-shadow: 0 0 40px rgba(255,107,0,0.7), 0 0 80px rgba(255,107,0,0.3); }
  }
  @keyframes radarSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes dropIn {
    0%   { transform: translateY(-60px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  @keyframes glitch {
    0%,100% { clip-path: inset(0 0 100% 0); }
    20%     { clip-path: inset(30% 0 50% 0); transform: translateX(-4px); }
    40%     { clip-path: inset(10% 0 70% 0); transform: translateX(4px); }
    60%     { clip-path: inset(60% 0 20% 0); transform: translateX(-2px); }
    80%     { clip-path: inset(80% 0 5% 0); transform: translateX(2px); }
  }

  /* Tabs */
  .bgmi-tabs {
    display: flex; gap: 2px;
    background: #000; padding: 2px;
    border-bottom: 1px solid var(--border);
  }
  .bgmi-tab {
    flex: 1; padding: 0.7rem 1rem;
    background: transparent; border: none;
    font-family: 'Exo 2', sans-serif;
    font-weight: 700; font-size: 0.8rem;
    letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
    color: rgba(255,255,255,0.4);
    position: relative; overflow: hidden;
  }
  .bgmi-tab.active {
    background: linear-gradient(180deg, rgba(255,107,0,0.2) 0%, rgba(255,107,0,0.05) 100%);
    color: var(--orange);
    border-bottom: 2px solid var(--orange);
  }
  .bgmi-tab:hover:not(.active) { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }

  /* Battle arena */
  .arena {
    background:
      radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,107,0,0.04) 0%, transparent 70%),
      repeating-linear-gradient(0deg,   transparent, transparent 39px, rgba(30,58,95,0.3) 39px, rgba(30,58,95,0.3) 40px),
      repeating-linear-gradient(90deg,  transparent, transparent 39px, rgba(30,58,95,0.3) 39px, rgba(30,58,95,0.3) 40px),
      #080c10;
    position: relative; overflow: hidden;
    min-height: 500px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2rem;
  }
  .arena::before {
    content: ''; position: absolute;
    width: 600px; height: 600px;
    border: 1px solid rgba(255,107,0,0.08);
    border-radius: 50%;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    animation: zoneRing 4s ease-in-out infinite;
  }
  .arena::after {
    content: ''; position: absolute;
    width: 300px; height: 300px;
    border: 1px solid rgba(255,107,0,0.12);
    border-radius: 50%;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    animation: zoneRing 3s ease-in-out infinite reverse;
  }

  /* Fighter card */
  .fighter-card {
    background: linear-gradient(135deg, rgba(13,21,32,0.95), rgba(8,12,16,0.98));
    border: 1px solid var(--border);
    width: 240px; padding: 1.5rem;
    position: relative; z-index: 2;
    clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  }
  .fighter-card.attacker { border-color: rgba(255,107,0,0.5); }
  .fighter-card.defender { border-color: rgba(0,207,255,0.5); }
  .fighter-card.attacker::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,107,0,0.07), transparent);
    pointer-events: none;
  }
  .fighter-card.defender::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(0,207,255,0.07), transparent);
    pointer-events: none;
  }

  /* Health bar */
  .health-bar-bg {
    height: 8px; background: rgba(255,255,255,0.1);
    border-radius: 0; margin: 0.5rem 0; position: relative; overflow: hidden;
  }
  .health-bar-fill {
    height: 100%; border-radius: 0;
    transition: width 0.5s ease;
    position: relative;
  }
  .health-bar-fill::after {
    content: '';
    position: absolute; right: 0; top: 0; bottom: 0; width: 3px;
    background: white; opacity: 0.8;
    box-shadow: 0 0 6px white;
  }
  .health-bar-fill.attacker { background: linear-gradient(90deg, #ff4500, #ff6b00, #ffd000); }
  .health-bar-fill.defender { background: linear-gradient(90deg, #0066ff, #00cfff, #00ff88); }

  /* VS badge */
  .vs-badge {
    font-family: 'Orbitron', monospace;
    font-size: 2.5rem; font-weight: 900;
    color: var(--yellow);
    filter: drop-shadow(0 0 20px rgba(255,208,0,0.8));
    z-index: 3; position: relative;
    animation: bgmiPulse 2s ease-in-out infinite;
    text-align: center; line-height: 1;
    padding: 0 2rem;
  }

  /* Weapon/repo badge */
  .weapon-badge {
    display: flex; align-items: center; gap: 0.4rem;
    background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
    padding: 0.3rem 0.6rem; margin-top: 0.5rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem;
    color: rgba(255,255,255,0.7);
  }

  /* Kill feed */
  .kill-feed {
    position: absolute; right: 1rem; top: 1rem;
    display: flex; flex-direction: column; gap: 0.3rem;
    z-index: 10; max-width: 280px;
  }
  .kill-feed-item {
    background: rgba(0,0,0,0.85);
    border-left: 3px solid var(--kill);
    padding: 0.3rem 0.6rem;
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem;
    animation: killFeed 4s ease forwards;
    color: white;
  }

  /* Battle log */
  .battle-log {
    background: rgba(0,0,0,0.7);
    border: 1px solid var(--border);
    border-top: 2px solid var(--orange);
    padding: 1rem; font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem; color: #aaa;
    max-height: 200px; overflow-y: auto;
    position: relative; z-index: 2; width: 100%; max-width: 700px;
    margin-top: 1.5rem;
  }
  .battle-log-line { padding: 0.2rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .battle-log-line.win  { color: var(--green); }
  .battle-log-line.loss { color: var(--kill); }
  .battle-log-line.final { color: var(--yellow); font-weight: bold; font-size: 0.85rem; }

  /* Declare war panel */
  .war-panel {
    background: var(--panel);
    border: 1px solid var(--border);
    padding: 1.5rem;
    position: relative; overflow: hidden;
  }
  .war-panel::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--orange), transparent);
  }

  /* Enemy list */
  .enemy-card {
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border);
    padding: 0.75rem 1rem;
    display: flex; align-items: center; gap: 0.75rem;
    cursor: pointer; transition: all 0.2s;
    margin-bottom: 2px;
    position: relative; overflow: hidden;
  }
  .enemy-card:hover, .enemy-card.selected {
    border-color: var(--orange);
    background: rgba(255,107,0,0.08);
  }
  .enemy-card.selected::before {
    content: '▶';
    position: absolute; right: 0.75rem;
    color: var(--orange); font-size: 0.8rem;
  }

  /* Repo weapon card */
  .weapon-card {
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border);
    padding: 0.75rem; cursor: pointer;
    transition: all 0.2s; position: relative;
  }
  .weapon-card:hover, .weapon-card.selected {
    border-color: var(--yellow);
    background: rgba(255,208,0,0.06);
  }
  .weapon-card.selected::after {
    content: '✓ EQUIPPED';
    position: absolute; top: 0.4rem; right: 0.4rem;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.55rem; color: var(--green);
  }

  /* Power meter */
  .power-meter {
    height: 4px; background: rgba(255,255,255,0.08); margin-top: 0.4rem;
  }
  .power-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--orange), var(--yellow));
    transition: width 0.5s;
  }

  /* Action button */
  .bgmi-btn {
    font-family: 'Orbitron', monospace;
    font-weight: 700; font-size: 0.85rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    border: none; padding: 0.85rem 2rem;
    cursor: pointer; transition: all 0.25s;
    position: relative; overflow: hidden;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
  }
  .bgmi-btn-fire {
    background: linear-gradient(135deg, #ff4500, #ff6b00, #ff9500);
    color: white;
    box-shadow: 0 0 30px rgba(255,107,0,0.4);
  }
  .bgmi-btn-fire:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 50px rgba(255,107,0,0.7);
  }
  .bgmi-btn-fire:active { transform: translateY(0); animation: shake 0.2s; }
  .bgmi-btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: rgba(255,255,255,0.5);
    clip-path: none; padding: 0.75rem 1.5rem;
  }
  .bgmi-btn-ghost:hover { border-color: var(--orange); color: var(--orange); }
  .bgmi-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none !important; }

  /* War history card */
  .war-history-card {
    background: var(--panel); border: 1px solid var(--border);
    padding: 1rem 1.25rem; margin-bottom: 2px;
    display: flex; align-items: center; gap: 1rem;
    transition: background 0.2s;
  }
  .war-history-card:hover { background: rgba(255,107,0,0.05); }
  .war-result-win  { border-left: 3px solid var(--green); }
  .war-result-loss { border-left: 3px solid var(--kill); }
  .war-result-pending { border-left: 3px solid var(--yellow); animation: bgmiPulse 2s infinite; }

  /* Radar */
  .radar {
    width: 80px; height: 80px;
    border: 2px solid rgba(0,255,136,0.3);
    border-radius: 50%; position: relative; overflow: hidden;
    background: radial-gradient(circle, rgba(0,255,136,0.05), transparent);
    flex-shrink: 0;
  }
  .radar-sweep {
    position: absolute; top: 50%; left: 50%;
    width: 50%; height: 2px;
    background: linear-gradient(90deg, rgba(0,255,136,0.8), transparent);
    transform-origin: left center;
    animation: radarSpin 3s linear infinite;
  }

  /* Zone indicator */
  .zone-bar {
    background: linear-gradient(90deg, var(--green), var(--yellow), var(--orange), var(--red));
    height: 4px; border-radius: 2px; position: relative;
  }
  .zone-pointer {
    position: absolute; top: -4px;
    width: 0; height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid white;
    transform: translateX(-50%);
    transition: left 0.5s;
  }

  /* Countdown */
  .countdown-overlay {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.85);
    pointer-events: none;
  }
  .countdown-num {
    font-family: 'Orbitron', monospace;
    font-size: 8rem; font-weight: 900;
    color: var(--orange);
    filter: drop-shadow(0 0 40px rgba(255,107,0,0.9));
    animation: countDown 1s ease forwards;
  }

  /* Pending attack */
  .incoming-attack {
    background: rgba(255,26,26,0.08);
    border: 1px solid rgba(255,26,26,0.4);
    padding: 1.25rem; margin-bottom: 0.75rem;
    animation: bgmiPulse 1.5s ease-in-out infinite;
    position: relative; overflow: hidden;
  }
  .incoming-attack::before {
    content: '⚠ INCOMING ATTACK';
    position: absolute; top: 0; right: 0;
    background: var(--red); color: white;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem; padding: 2px 8px;
    letter-spacing: 0.1em;
  }

  /* Scrollbar */
  .bgmi-root ::-webkit-scrollbar { width: 3px; }
  .bgmi-root ::-webkit-scrollbar-track { background: #000; }
  .bgmi-root ::-webkit-scrollbar-thumb { background: var(--orange); }
`;

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function WarsPage() {
    const { user } = useStore();
    const [wars, setWars] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [myRepos, setMyRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('arena');
    const [battleResult, setBattleResult] = useState(null);
    const [killFeed, setKillFeed] = useState([]);

    useEffect(() => {
        Promise.all([
            warsApi.forUser(user?.id),
            usersApi.getAll({ limit: 50 }),
            reposApi.forUser(user?.id),
        ]).then(([wRes, uRes, rRes]) => {
            setWars(wRes.data.wars);
            setAllUsers(uRes.data.users.filter(u2 => u2.id !== user?.id));
            setMyRepos(rRes.data.repos);
        }).finally(() => setLoading(false));
    }, [user]);

    const loadWars = async () => {
        const res = await warsApi.forUser(user?.id);
        setWars(res.data.wars);
    };

    const addKillFeed = (msg) => {
        const id = Date.now();
        setKillFeed(f => [...f.slice(-4), { id, msg }]);
        setTimeout(() => setKillFeed(f => f.filter(k => k.id !== id)), 4000);
    };

    const handleRespond = async (warId, defRepoId, accept) => {
        try {
            const res = await warsApi.respond(warId, { defender_repo_id: defRepoId, accept });
            if (res.data.result) {
                setBattleResult(res.data.result);
                const r = res.data.result;
                addKillFeed(r.winner === 'attacker'
                    ? `💀 ${user?.username} got eliminated!`
                    : `🏆 ${user?.username} won the battle!`);
            }
            await loadWars();
            toast.success(accept ? '⚔️ Battle complete!' : 'War declined.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#080c10', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, border: '3px solid #1e3a5f', borderTopColor: '#ff6b00', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,107,0,0.6)', letterSpacing: '0.3em' }}>
                LOADING BATTLE DATA...
            </div>
        </div>
    );

    const pendingDefense = wars.filter(w => w.defender_id === user?.id && w.status === 'pending');

    return (
        <div className="bgmi-root" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <style>{BGMI_STYLES}</style>

            {/* HUD */}
            <div className="bgmi-hud">
                <div>
                    <div className="bgmi-title">⚔ WAR ROOM</div>
                    <div className="bgmi-subtitle">GITWORLD BATTLE ROYALE — SEASON 1</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {pendingDefense.length > 0 && (
                        <div className="bgmi-stat-pill" style={{ borderColor: 'rgba(255,26,26,0.5)', color: '#ff4444', animation: 'bgmiPulse 1s infinite' }}>
                            ⚠ {pendingDefense.length} INCOMING
                        </div>
                    )}
                    <div className="bgmi-stat-pill">🏆 {user?.wars_won || 0} WINS</div>
                    <div className="bgmi-stat-pill">💀 {user?.wars_lost || 0} LOSSES</div>
                    <div className="bgmi-stat-pill" style={{ borderColor: 'rgba(255,208,0,0.4)', color: '#ffd000' }}>
                        {user?.plan === 'free' ? `${user?.wars_this_month || 0}/2 WARS` : '∞ UNLIMITED'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bgmi-tabs">
                {[
                    ['arena', '🎯 BATTLE ARENA'],
                    ['declare', '⚔ DECLARE WAR'],
                    ['history', '📋 MATCH HISTORY'],
                    ['all', '🌍 ALL BATTLES'],
                ].map(([t, l]) => (
                    <button key={t} className={`bgmi-tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}>
                        {l}
                        {t === 'arena' && pendingDefense.length > 0 && (
                            <span style={{ marginLeft: '0.4rem', background: '#ff1a1a', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>
                                {pendingDefense.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {tab === 'arena' && <ArenaTab wars={wars} user={user} myRepos={myRepos} onRespond={handleRespond} onRefresh={loadWars} killFeed={killFeed} addKillFeed={addKillFeed} allUsers={allUsers} />}
                {tab === 'declare' && <DeclareTab users={allUsers} myRepos={myRepos} user={user} onDeclared={() => { loadWars(); setTab('arena'); }} addKillFeed={addKillFeed} />}
                {tab === 'history' && <HistoryTab wars={wars} userId={user?.id} />}
                {tab === 'all' && <AllBattlesTab />}
            </div>

            {/* Battle result modal */}
            {battleResult && <BattleModal result={battleResult} user={user} onClose={() => setBattleResult(null)} />}
        </div>
    );
}

// ─── ARENA TAB ────────────────────────────────────────────────
function ArenaTab({ wars, user, myRepos, onRespond, killFeed, allUsers }) {
    const pendingDefense = wars.filter(w => w.defender_id === user?.id && w.status === 'pending');
    const recentBattle = wars.find(w => w.status === 'completed');
    const [respondingTo, setRespondingTo] = useState(null);
    const [selectedRepo, setSelectedRepo] = useState('');

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            {/* Incoming attacks */}
            {pendingDefense.map(war => (
                <div key={war.id} style={{ padding: '1rem 1.5rem' }}>
                    <div className="incoming-attack">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingTop: '0.5rem' }}>
                            <div>
                                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1rem', color: '#ff4444', marginBottom: 4 }}>
                                    ENEMY ATTACK DETECTED
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'white' }}>
                                    <span style={{ color: '#ff6b00', fontWeight: 700 }}>@{war.attacker_name}</span>
                                    <span style={{ color: '#aaa' }}> is attacking with </span>
                                    <span style={{ color: '#ffd000', fontFamily: "'Share Tech Mono', monospace" }}>📦 {war.attacker_repo_name}</span>
                                </div>
                            </div>
                        </div>

                        {respondingTo === war.id ? (
                            <div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,107,0,0.6)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>
                                    SELECT YOUR WEAPON
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {myRepos.map(r => (
                                        <div key={r.id} className={`weapon-card ${selectedRepo === r.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedRepo(r.id)}>
                                            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>📦 {r.name}</div>
                                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ffd000', marginTop: 2 }}>
                                                PWR {r.power_score?.toFixed(0)} · ★{r.stars?.toLocaleString()}
                                            </div>
                                            <div className="power-meter">
                                                <div className="power-fill" style={{ width: `${Math.min(100, r.power_score || 0)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="bgmi-btn bgmi-btn-fire"
                                        disabled={!selectedRepo}
                                        onClick={() => { onRespond(war.id, selectedRepo, true); setRespondingTo(null); }}>
                                        🔥 FIGHT NOW
                                    </button>
                                    <button className="bgmi-btn bgmi-btn-ghost"
                                        onClick={() => { onRespond(war.id, null, false); setRespondingTo(null); }}>
                                        RETREAT
                                    </button>
                                    <button className="bgmi-btn bgmi-btn-ghost" onClick={() => setRespondingTo(null)}>
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="bgmi-btn bgmi-btn-fire" onClick={() => setRespondingTo(war.id)}
                                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                                ⚔ RESPOND TO ATTACK
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Live arena with recent battle preview */}
            <div className="arena" style={{ margin: '0 1.5rem 1.5rem', position: 'relative' }}>
                {/* Kill feed */}
                <div className="kill-feed">
                    {killFeed.map(k => (
                        <div key={k.id} className="kill-feed-item">{k.msg}</div>
                    ))}
                </div>

                {recentBattle ? (
                    <RecentBattleDisplay war={recentBattle} userId={user?.id} />
                ) : (
                    <EmptyArena user={user} />
                )}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(30,58,95,0.3)', margin: '0 1.5rem 1.5rem' }}>
                {[
                    { icon: '🏆', label: 'WINS', val: user?.wars_won || 0, color: '#00ff88' },
                    { icon: '💀', label: 'LOSSES', val: user?.wars_lost || 0, color: '#ff4444' },
                    { icon: '🎯', label: 'WIN RATE', val: (user?.wars_won + user?.wars_lost) > 0 ? `${Math.round((user?.wars_won / (user?.wars_won + user?.wars_lost)) * 100)}%` : '--', color: '#ffd000' },
                    { icon: '⚔', label: 'THIS MONTH', val: `${user?.wars_this_month || 0}`, color: '#ff6b00' },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--panel)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.3rem', color: s.color, fontWeight: 700 }}>{s.val}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Recent battle display inside arena
function RecentBattleDisplay({ war, userId }) {
    const isWinner = war.winner_id === userId;
    const aScore = war.attacker_score || 0;
    const dScore = war.defender_score || 0;
    const maxScore = Math.max(aScore, dScore, 1);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 2, position: 'relative', width: '100%', maxWidth: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Attacker */}
            <div className="fighter-card attacker" style={{ animation: 'dropIn 0.5s ease' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,107,0,0.6)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                    ATTACKER
                </div>
                <div style={{ color: '#ff6b00', fontWeight: 800, fontSize: '1.1rem' }}>@{war.attacker_name}</div>
                <div className="weapon-badge">📦 {war.attacker_repo_name || 'Unknown'}</div>
                <div className="health-bar-bg" style={{ marginTop: '0.75rem' }}>
                    <div className="health-bar-fill attacker" style={{ width: `${(aScore / maxScore) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>PWR</span>
                    <span style={{ color: '#ffd000' }}>{aScore.toFixed(1)}</span>
                </div>
                {war.winner_id === (war.attacker_id) && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'center', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', color: '#00ff88' }}>
                        👑 WINNER
                    </div>
                )}
            </div>

            {/* VS */}
            <div className="vs-badge">VS</div>

            {/* Defender */}
            <div className="fighter-card defender" style={{ animation: 'dropIn 0.5s ease 0.2s both' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(0,207,255,0.6)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                    DEFENDER
                </div>
                <div style={{ color: '#00cfff', fontWeight: 800, fontSize: '1.1rem' }}>@{war.defender_name}</div>
                <div className="weapon-badge">📦 {war.defender_repo_name || 'Unknown'}</div>
                <div className="health-bar-bg" style={{ marginTop: '0.75rem' }}>
                    <div className="health-bar-fill defender" style={{ width: `${(dScore / maxScore) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>PWR</span>
                    <span style={{ color: '#00cfff' }}>{dScore.toFixed(1)}</span>
                </div>
                {war.winner_id === (war.defender_id) && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'center', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', color: '#00ff88' }}>
                        👑 WINNER
                    </div>
                )}
            </div>

            {/* Result label */}
            <div style={{
                position: 'absolute', bottom: '-0.5rem', left: '50%', transform: 'translateX(-50%)',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', whiteSpace: 'nowrap',
            }}>
                LAST BATTLE · {war.territory_gained?.toFixed(3)}% TERRITORY TRANSFERRED
            </div>
        </div>
    );
}

function EmptyArena({ user }) {
    return (
        <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.2rem', color: 'rgba(255,107,0,0.3)', marginBottom: '0.5rem' }}>
                NO ACTIVE BATTLES
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
                DECLARE WAR TO ENTER THE ARENA
            </div>
            {/* Radar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <div className="radar">
                    <div className="radar-sweep" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
                            background: 'rgba(0,255,136,0.8)', borderRadius: '50%',
                            top: `${20 + Math.random() * 60}%`, left: `${20 + Math.random() * 60}%`,
                            boxShadow: '0 0 4px rgba(0,255,136,0.8)',
                        }} />
                    ))}
                </div>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,255,136,0.4)', marginTop: '0.5rem' }}>
                {user?.username?.toUpperCase()} · SCANNING FOR ENEMIES
            </div>
        </div>
    );
}

// ─── DECLARE WAR TAB ──────────────────────────────────────────
function DeclareTab({ users, myRepos, user, onDeclared, addKillFeed }) {
    const [targetId, setTargetId] = useState('');
    const [repoId, setRepoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const target = users.find(u => u.id === targetId);
    const myWeapon = myRepos.find(r => r.id === repoId);
    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) && !u.is_protected
    );
    const protected_ = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) && u.is_protected
    );

    const handleDeclare = async () => {
        if (!targetId || !repoId) return toast.error('Select target and weapon!');
        setLoading(true);
        try {
            await warsApi.declare({ defender_id: targetId, attacker_repo_id: repoId });
            addKillFeed(`⚔ @${user?.username} declared war on @${target?.username}!`);
            toast.success('⚔️ War declared! Awaiting response…');
            onDeclared();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Enemy selection */}
                <div className="war-panel">
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', color: 'var(--orange)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                        🎯 SELECT ENEMY
                    </div>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search enemies..."
                        style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: 'white', padding: '0.5rem 0.75rem', fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem', marginBottom: '0.75rem', outline: 'none' }}
                    />
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {filtered.length === 0 && (
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', padding: '1rem', textAlign: 'center' }}>
                                NO ENEMIES FOUND
                            </div>
                        )}
                        {filtered.map(u => (
                            <div key={u.id} className={`enemy-card ${targetId === u.id ? 'selected' : ''}`}
                                onClick={() => setTargetId(u.id)}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: u.territory_color || '#ff6b00', boxShadow: `0 0 6px ${u.territory_color || '#ff6b00'}`, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>@{u.username}</div>
                                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                                        {u.tier?.replace('_', '-').toUpperCase()} · ★{u.total_stars?.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,107,0,0.7)' }}>
                                    {u.wars_won || 0}W/{u.wars_lost || 0}L
                                </div>
                            </div>
                        ))}
                        {protected_.length > 0 && (
                            <>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,255,136,0.4)', padding: '0.5rem 0.75rem', letterSpacing: '0.15em' }}>
                                    🛡️ PROTECTED PLAYERS
                                </div>
                                {protected_.map(u => (
                                    <div key={u.id} className="enemy-card" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: 'white', fontSize: '0.9rem' }}>@{u.username}</div>
                                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#00ff88' }}>🛡️ NEWCOMER SHIELD</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Weapon selection */}
                <div className="war-panel">
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', color: 'var(--orange)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                        🔫 SELECT WEAPON (REPO)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 340, overflowY: 'auto' }}>
                        {myRepos.length === 0 && (
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', padding: '1rem', textAlign: 'center' }}>
                                NO WEAPONS. ADD REPOS FIRST.
                            </div>
                        )}
                        {myRepos.map(r => (
                            <div key={r.id} className={`weapon-card ${repoId === r.id ? 'selected' : ''}`}
                                onClick={() => setRepoId(r.id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>📦 {r.name}</div>
                                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#ffd000', fontWeight: 700 }}>
                                        {r.power_score?.toFixed(0)} PWR
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                                    <span>★{r.stars?.toLocaleString()}</span>
                                    <span>⑂{r.forks?.toLocaleString()}</span>
                                    <span>📝{r.commits?.toLocaleString()}</span>
                                </div>
                                <div className="power-meter" style={{ marginTop: '0.5rem' }}>
                                    <div className="power-fill" style={{ width: `${Math.min(100, r.power_score || 0)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matchup preview */}
            {target && myWeapon && (
                <div style={{ marginBottom: '1.5rem', animation: 'dropIn 0.3s ease' }}>
                    <div className="arena" style={{ minHeight: 'auto', padding: '1.5rem', borderRadius: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 2, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <div className="fighter-card attacker">
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,107,0,0.6)', letterSpacing: '0.2em' }}>YOU</div>
                                <div style={{ color: '#ff6b00', fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>@{user?.username}</div>
                                <div className="weapon-badge">📦 {myWeapon.name}</div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#ffd000', marginTop: '0.4rem' }}>
                                    PWR {myWeapon.power_score?.toFixed(0)}
                                </div>
                            </div>
                            <div className="vs-badge" style={{ fontSize: '2rem' }}>VS</div>
                            <div className="fighter-card defender">
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(0,207,255,0.6)', letterSpacing: '0.2em' }}>ENEMY</div>
                                <div style={{ color: '#00cfff', fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>@{target.username}</div>
                                <div className="weapon-badge">🏴 {target.tier?.replace('_', '-')} territory</div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#aaa', marginTop: '0.4rem' }}>
                                    ★{target.total_stars?.toLocaleString()} total
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fire button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="bgmi-btn bgmi-btn-fire"
                    onClick={handleDeclare}
                    disabled={!targetId || !repoId || loading}
                    style={{ fontSize: '1rem', padding: '1rem 3rem' }}>
                    {loading
                        ? <span style={{ fontFamily: "'Share Tech Mono', monospace" }}>DEPLOYING...</span>
                        : '🔥 DECLARE WAR'}
                </button>
            </div>
        </div>
    );
}

// ─── HISTORY TAB ─────────────────────────────────────────────
function HistoryTab({ wars, userId }) {
    const done = wars.filter(w => w.status === 'completed' || w.status === 'declined');
    const pending = wars.filter(w => w.status === 'pending');

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
            {pending.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ffd000', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                        ⏳ PENDING BATTLES
                    </div>
                    {pending.map(w => <WarHistoryRow key={w.id} war={w} userId={userId} />)}
                </div>
            )}
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                📋 MATCH HISTORY ({done.length} BATTLES)
            </div>
            {done.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                    NO BATTLES YET. DECLARE WAR TO BEGIN.
                </div>
            )}
            {done.map(w => <WarHistoryRow key={w.id} war={w} userId={userId} />)}
        </div>
    );
}

function WarHistoryRow({ war, userId }) {
    const isWin = war.winner_id === userId;
    const isPending = war.status === 'pending';
    const isAttacker = war.attacker_id === userId;

    return (
        <div className={`war-history-card ${isPending ? 'war-result-pending' : isWin ? 'war-result-win' : 'war-result-loss'}`}>
            {/* Result icon */}
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.3rem', flexShrink: 0, width: 36, textAlign: 'center' }}>
                {isPending ? '⏳' : isWin ? '🏆' : '💀'}
            </div>

            {/* Matchup */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.9rem' }}>@{war.attacker_name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>⚔</span>
                    <span style={{ color: '#00cfff', fontWeight: 700, fontSize: '0.9rem' }}>@{war.defender_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: 3, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', flexWrap: 'wrap' }}>
                    {war.attacker_repo_name && <span>⚔ {war.attacker_repo_name}</span>}
                    {war.defender_repo_name && <span>🛡 {war.defender_repo_name}</span>}
                    {war.declared_at && <span>{formatDistanceToNow(new Date(war.declared_at), { addSuffix: true })}</span>}
                </div>
            </div>

            {/* Score */}
            {war.status === 'completed' && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: isWin ? '#00ff88' : '#ff4444', fontWeight: 700 }}>
                        {isWin ? '+' : '-'}{war.territory_gained?.toFixed(4)}%
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
                        {war.attacker_score?.toFixed(1)} vs {war.defender_score?.toFixed(1)}
                    </div>
                </div>
            )}
            {isPending && (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ffd000', flexShrink: 0 }}>
                    AWAITING
                </div>
            )}
        </div>
    );
}

// ─── ALL BATTLES TAB ─────────────────────────────────────────
function AllBattlesTab() {
    const [wars, setWars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        warsApi.getAll({ limit: 30 }).then(r => setWars(r.data.wars)).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #1e3a5f', borderTopColor: '#ff6b00', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>
                🌍 GLOBAL BATTLE FEED — {wars.length} BATTLES
            </div>
            {wars.map(w => <WarHistoryRow key={w.id} war={w} userId={null} />)}
            {wars.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                    NO BATTLES RECORDED YET.
                </div>
            )}
        </div>
    );
}

// ─── BATTLE RESULT MODAL ─────────────────────────────────────
function BattleModal({ result, user, onClose }) {
    const [step, setStep] = useState(0);
    const [shaking, setShaking] = useState(false);
    const [showCountdown, setShowCountdown] = useState(true);
    const [countdown, setCountdown] = useState(3);
    const isWon = result.winner === 'attacker';

    // Countdown before battle starts
    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        } else {
            setShowCountdown(false);
        }
    }, [countdown]);

    useEffect(() => {
        if (showCountdown) return;
        if (step < result.rounds.length - 1) {
            const t = setTimeout(() => {
                setStep(s => s + 1);
                setShaking(true);
                setTimeout(() => setShaking(false), 300);
            }, 800);
            return () => clearTimeout(t);
        }
    }, [step, result.rounds.length, showCountdown]);

    const aScore = result.attackerScore || 0;
    const dScore = result.defenderScore || 0;
    const maxS = Math.max(aScore, dScore, 1);
    const aHp = Math.round((aScore / maxS) * 100);
    const dHp = Math.round((dScore / maxS) * 100);
    const progress = step / Math.max(result.rounds.length - 1, 1);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hpDrain { from{width:100%} to{width:var(--hp)} }
      `}</style>

            {/* Countdown overlay */}
            {showCountdown && countdown > 0 && (
                <div className="countdown-overlay">
                    <div key={countdown} className="countdown-num">{countdown}</div>
                </div>
            )}

            {!showCountdown && (
                <div style={{
                    width: '100%', maxWidth: 700,
                    background: 'linear-gradient(135deg, #0d1520, #080c10)',
                    border: `2px solid ${isWon ? 'rgba(0,255,136,0.4)' : 'rgba(255,68,68,0.4)'}`,
                    boxShadow: `0 0 80px ${isWon ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.15)'}`,
                    animation: shaking ? 'shake 0.3s ease' : 'dropIn 0.5s ease',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Top accent */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${isWon ? '#00ff88' : '#ff4444'}, transparent)` }} />

                    {/* Header */}
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                            fontFamily: "'Orbitron', monospace", fontSize: '1.1rem', fontWeight: 900,
                            color: isWon ? '#00ff88' : '#ff4444',
                            filter: `drop-shadow(0 0 10px ${isWon ? 'rgba(0,255,136,0.6)' : 'rgba(255,68,68,0.6)'})`
                        }}>
                            {isWon ? '🏆 VICTORY ROYALE' : '💀 ELIMINATED'}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                            {aScore.toFixed(1)} vs {dScore.toFixed(1)}
                        </div>
                    </div>

                    {/* Fighter HP bars */}
                    <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Attacker HP */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem' }}>
                                <span style={{ color: '#ff6b00', fontWeight: 700 }}>ATTACKER</span>
                                <span style={{ color: '#ffd000' }}>{aHp}HP</span>
                            </div>
                            <div className="health-bar-bg">
                                <div className="health-bar-fill attacker" style={{ width: `${aHp}%`, transition: 'width 1s ease' }} />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1rem', color: '#ffd000', textAlign: 'center' }}>VS</div>
                        {/* Defender HP */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem' }}>
                                <span style={{ color: '#00cfff', fontWeight: 700 }}>DEFENDER</span>
                                <span style={{ color: '#00cfff' }}>{dHp}HP</span>
                            </div>
                            <div className="health-bar-bg">
                                <div className="health-bar-fill defender" style={{ width: `${dHp}%`, transition: 'width 1s ease' }} />
                            </div>
                        </div>
                    </div>

                    {/* Zone shrink progress */}
                    <div style={{ padding: '0 1.5rem 0.75rem' }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>BATTLE PROGRESS</div>
                        <div className="zone-bar">
                            <div className="zone-pointer" style={{ left: `${progress * 100}%` }} />
                        </div>
                    </div>

                    {/* Battle log */}
                    <div className="battle-log" style={{ margin: '0 1rem 1rem', maxHeight: 180 }}>
                        {result.rounds.slice(0, step + 1).map((r, i) => (
                            <div key={i} className={`battle-log-line ${r.isFinal ? 'final' : r.winner === 'attacker' ? 'win' : 'loss'}`}
                                style={{ animation: 'dropIn 0.3s ease' }}>
                                {r.isFinal ? '🏆 ' : r.winner === 'attacker' ? '🔥 ' : '💧 '}
                                {r.event}
                            </div>
                        ))}
                    </div>

                    {/* Final result */}
                    {step >= result.rounds.length - 1 && (
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem',
                                color: isWon ? '#00ff88' : '#ff4444', fontWeight: 700
                            }}>
                                {isWon
                                    ? `+${result.territoryGained?.toFixed(4)}% TERRITORY GAINED`
                                    : `-${result.territoryGained?.toFixed(4)}% TERRITORY LOST`}
                            </div>
                            <button className="bgmi-btn bgmi-btn-fire" onClick={onClose}
                                style={{ padding: '0.6rem 1.5rem', fontSize: '0.75rem' }}>
                                CONTINUE →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}