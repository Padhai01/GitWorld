import React, { useEffect, useState } from 'react';
import { leaderboardApi } from '../utils/api';

const CATEGORIES = [
    { key: 'territory', label: 'Territory Size', icon: '🌍', unit: '%' },
    { key: 'stars', label: 'Total Stars', icon: '★', unit: '' },
    { key: 'wars_won', label: 'Wars Won', icon: '⚔️', unit: '' },
    { key: 'win_rate', label: 'Win Rate', icon: '🏆', unit: '%' },
];

const TIER_LABELS = {
    hamlet: '🏕️', village: '🏘️', city_state: '🏙️',
    kingdom: '👑', empire: '🌍', superpower: '🌌',
};

export default function LeaderboardPage() {
    const [category, setCategory] = useState('territory');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        leaderboardApi.get(category)
            .then(r => setEntries(r.data.entries))
            .finally(() => setLoading(false));
    }, [category]);

    const current = CATEGORIES.find(c => c.key === category);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '1.5rem', color: 'white', marginBottom: 4 }}>
                    🏆 Leaderboard
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--frost)' }}>
          // GLOBAL RANKINGS · UPDATED DAILY
                </div>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '1px', background: 'var(--steel)', marginBottom: '1.5rem' }}>
                {CATEGORIES.map(cat => (
                    <button key={cat.key} onClick={() => setCategory(cat.key)}
                        style={{
                            flex: 1, padding: '0.65rem 0.5rem',
                            background: category === cat.key ? 'var(--iron)' : 'var(--deep)',
                            border: 'none',
                            borderBottom: category === cat.key ? '2px solid var(--gold)' : '2px solid transparent',
                            color: category === cat.key ? 'white' : 'var(--frost)',
                            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem',
                            letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
                            textAlign: 'center',
                        }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{cat.icon}</div>
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <span className="spinner" />
                </div>
            ) : (
                <div>
                    {entries.map((entry, i) => (
                        <LeaderboardRow key={entry.username} entry={entry} rank={i + 1} category={current} />
                    ))}
                    {entries.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--steel)' }}>
                            No data yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LeaderboardRow({ entry, rank, category }) {
    const isTop3 = rank <= 3;
    const rankColors = ['var(--gold)', 'rgba(192,192,192,0.9)', 'rgba(205,127,50,0.9)'];
    const rankIcons = ['🥇', '🥈', '🥉'];

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.25rem',
            background: isTop3 ? `${entry.territory_color || '#4a8fa8'}0d` : 'var(--deep)',
            border: `1px solid ${isTop3 ? (entry.territory_color || 'var(--steel)') + '44' : 'var(--steel)'}`,
            marginBottom: '2px',
            transition: 'background 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.background = isTop3 ? `${entry.territory_color || '#4a8fa8'}0d` : 'var(--deep)'}
        >
            {/* Rank */}
            <div style={{
                width: 36, textAlign: 'center', flexShrink: 0,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: isTop3 ? '1.3rem' : '0.85rem',
                color: isTop3 ? rankColors[rank - 1] : 'var(--steel)',
            }}>
                {isTop3 ? rankIcons[rank - 1] : `#${rank}`}
            </div>

            {/* Color dot */}
            <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                background: entry.territory_color || 'var(--frost)',
                boxShadow: `0 0 6px ${entry.territory_color || 'var(--frost)'}`,
            }} />

            {/* Username */}
            <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    @{entry.username}
                </div>
                {entry.tier && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--frost)', marginTop: 1 }}>
                        {TIER_LABELS[entry.tier]} {entry.tier?.replace('_', '-').toUpperCase()}
                    </div>
                )}
            </div>

            {/* Value */}
            <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '1.1rem',
                color: isTop3 ? rankColors[rank - 1] : 'var(--gold)',
                fontWeight: 700, flexShrink: 0,
            }}>
                {category.key === 'territory'
                    ? `${Number(entry.value).toFixed(3)}%`
                    : category.key === 'win_rate'
                        ? `${entry.value}%`
                        : category.key === 'stars'
                            ? `★${Number(entry.value).toLocaleString()}`
                            : entry.value}
            </div>
        </div>
    );
}