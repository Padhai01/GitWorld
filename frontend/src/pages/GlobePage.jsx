import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
const Globe3D = React.lazy(() => import('../components/Globe3D'));
import { usersApi, leaderboardApi } from '../utils/api';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';

const TIER_LABELS = {
  hamlet: '🏕️ Hamlet', village: '🏘️ Village', city_state: '🏙️ City-State',
  kingdom: '👑 Kingdom', empire: '🌍 Empire', superpower: '🌌 Superpower',
};

export default function GlobePage() {
  const { globeUsers, setGlobeUsers, selectedUser, setSelectedUser, globeEvents, setGlobeEvents, user } = useStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      usersApi.getGlobe(),
      leaderboardApi.globeEvents(),
    ]).then(([usersRes, eventsRes]) => {
      setGlobeUsers(usersRes.data.users);
      setGlobeEvents(eventsRes.data.events);
    }).finally(() => setLoading(false));
  }, []);

  const handleSelectUser = useCallback((u) => {
    setSelectedUser(u);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Globe canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--frost)', letterSpacing: '0.2em' }}>
              LOADING GLOBE…
            </div>
          </div>
        ) : (
          <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><div className="spinner" style={{width:48,height:48}} /></div>}>
            <Globe3D
            users={globeUsers}
            onSelectUser={handleSelectUser}
            selectedUser={selectedUser}
            style={{ width: "100%", height: "100%" }}
          />
          </Suspense>
        )}

        {/* Stats overlay top-left */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          {[
            { label: 'TERRITORIES', value: globeUsers.length },
            { label: 'ACTIVE WARS', value: globeEvents.filter(e => e.type === 'war_result').length },
            { label: 'SUPERPOWERS', value: globeUsers.filter(u => u.tier === 'superpower').length },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(6,13,24,0.85)',
              border: '1px solid var(--steel)',
              padding: '0.4rem 0.75rem',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'var(--frost)', letterSpacing: '0.2em' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1rem', color: 'var(--glow)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: 300, background: 'var(--deep)',
        borderLeft: '1px solid var(--steel)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {selectedUser ? (
          <UserPanel user={selectedUser} onClose={() => setSelectedUser(null)}
            onNavigate={() => navigate(`/profile/${selectedUser.username}`)}
            currentUser={user} />
        ) : (
          <EventFeed events={globeEvents} />
        )}
      </div>
    </div>
  );
}

function UserPanel({ user, onClose, onNavigate, currentUser }) {
  const tierColors = {
    hamlet: 'var(--ice)', village: 'var(--grass)', city_state: 'var(--gold)',
    kingdom: 'var(--fire)', empire: 'var(--glow)', superpower: 'var(--gold)',
  };
  const color = tierColors[user.tier] || 'var(--ice)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid var(--steel)',
        background: `linear-gradient(135deg, ${user.territory_color}15, transparent)`,
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'none', border: 'none', color: 'var(--frost)',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
        }}>✕</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44,
            background: `radial-gradient(circle, ${user.territory_color}44, var(--void))`,
            border: `2px solid ${user.territory_color}`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem',
          }}>
            {user.tier === 'superpower' ? '🌌' : user.tier === 'empire' ? '🌍' :
             user.tier === 'kingdom' ? '👑' : user.tier === 'city_state' ? '🏙️' :
             user.tier === 'village' ? '🏘️' : '🏕️'}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>@{user.username}</div>
            <div style={{ color, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em' }}>
              {TIER_LABELS[user.tier]}
            </div>
          </div>
        </div>
        {user.territory_name && (
          <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text)', fontSize: '0.85rem' }}>
            "{user.territory_name}"
          </div>
        )}
        {user.is_protected ? (
          <div style={{ marginTop: '0.5rem' }}>
            <span className="tag" style={{ color: 'var(--grass)', borderColor: 'var(--grass)', fontSize: '0.6rem' }}>
              🛡️ PROTECTED
            </span>
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div style={{ padding: '1rem 1.25rem', flex: 1, overflowY: 'auto' }}>
        {[
          { k: 'Total Stars',    v: `★ ${(user.total_stars || 0).toLocaleString()}` },
          { k: 'Territory',      v: `${(user.territory_size || 0).toFixed(4)}%` },
          { k: 'Wars Won',       v: user.wars_won || 0 },
          { k: 'Wars Lost',      v: user.wars_lost || 0 },
          { k: 'Win Rate',       v: (user.wars_won + user.wars_lost) > 0
              ? `${Math.round(user.wars_won / (user.wars_won + user.wars_lost) * 100)}%` : 'N/A' },
          { k: 'Biome',          v: user.biome?.replace('_', ' ')?.toUpperCase() },
        ].map(s => (
          <div key={s.k} className="stat-row">
            <span className="stat-key">{s.k}</span>
            <span className="stat-val">{s.v}</span>
          </div>
        ))}

        {/* Territory progress bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--frost)' }}>
              GLOBE COVERAGE
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--steel)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(100, (user.territory_size || 0) * 8)}%`,
              background: `linear-gradient(90deg, ${user.territory_color || '#4a8fa8'}, var(--glow))`,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--steel)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="btn btn-ghost" onClick={onNavigate}
          style={{ width: '100%', justifyContent: 'center' }}>
          👁 View Full Profile
        </button>
        {currentUser && currentUser.id !== user.id && !user.is_protected && (
          <button className="btn btn-danger"
            onClick={() => alert('Go to Wars page to declare war!')}
            style={{ width: '100%', justifyContent: 'center' }}>
            ⚔️ Declare War
          </button>
        )}
      </div>
    </div>
  );
}

function EventFeed({ events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--steel)',
      }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '0.9rem', color: 'white' }}>
          Globe Events
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--frost)', marginTop: 2 }}>
          // LIVE FEED
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {events.length === 0 && (
          <div style={{
            padding: '2rem', textAlign: 'center',
            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--steel)',
          }}>
            No events yet.<br />Start a war to make history.
          </div>
        )}
        {events.map(evt => (
          <div key={evt.id} style={{
            padding: '0.75rem',
            borderLeft: `2px solid ${evt.territory_color || 'var(--steel)'}`,
            marginBottom: '0.5rem',
            background: 'rgba(10,22,40,0.5)',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
              {evt.description}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--frost)', marginTop: 3 }}>
              {formatDistanceToNow(new Date(evt.occurred_at), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--steel)' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--frost)', marginBottom: '0.5rem', letterSpacing: '0.2em' }}>
          TIER LEGEND
        </div>
        {[
          { color: 'var(--ice)',   label: 'Hamlet (0–100★)' },
          { color: 'var(--grass)', label: 'Village (100–1K★)' },
          { color: 'var(--gold)',  label: 'City-State (1K–10K★)' },
          { color: 'var(--fire)',  label: 'Kingdom (10K–50K★)' },
          { color: 'var(--glow)', label: 'Empire (50K–100K★)' },
          { color: 'var(--gold)',  label: 'Superpower (100K+★)' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--text)' }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
