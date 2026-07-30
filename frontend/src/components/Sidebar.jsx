import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const NAV_ITEMS = [
    { to: '/', icon: '🌐', label: 'Globe' },
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/wars', icon: '⚔️', label: 'Wars' },
    { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { to: '/repos', icon: '📦', label: 'Repositories' },
    { to: '/profile', icon: '👑', label: 'My Empire' },
];

const TIER_ICONS = {
    hamlet: '🏕️', village: '🏘️', city_state: '🏙️',
    kingdom: '👑', empire: '🌍', superpower: '🌌',
};

export default function Sidebar() {
    const { user, unreadCount, logout } = useStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside style={{
            width: 'var(--sidebar-w)',
            flexShrink: 0,
            background: 'var(--deep)',
            borderRight: '1px solid var(--steel)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            zIndex: 100,
        }}>
            {/* Brand */}
            <div style={{
                padding: '1.5rem 1.25rem 1rem',
                borderBottom: '1px solid var(--steel)',
            }}>
                <div style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: '1.4rem',
                    color: 'var(--glow)',
                    textShadow: '0 0 20px rgba(0,229,255,0.4)',
                    letterSpacing: '0.05em',
                }}>
                    GitWorld
                </div>
                <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.58rem',
                    color: 'var(--frost)',
                    letterSpacing: '0.25em',
                    marginTop: 2,
                }}>
                    CODE IS POWER · STARS ARE LAND
                </div>
            </div>

            {/* User info */}
            {user && (
                <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--steel)',
                    background: 'rgba(0,229,255,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38, height: 38,
                            background: `linear-gradient(135deg, ${user.territory_color || '#4a8fa8'}, var(--void))`,
                            border: `2px solid ${user.territory_color || '#4a8fa8'}`,
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem',
                            flexShrink: 0,
                        }}>
                            {TIER_ICONS[user.tier] || '🌍'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }}>
                                @{user.username}
                            </div>
                            <div style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: '0.6rem', color: 'var(--frost)',
                                letterSpacing: '0.1em', marginTop: 2,
                            }}>
                                {user.tier?.replace('_', '-').toUpperCase()} · ★{(user.total_stars || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    {/* Territory size bar */}
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--frost)' }}>
                                TERRITORY
                            </span>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--gold)' }}>
                                {(user.territory_size || 0).toFixed(3)}%
                            </span>
                        </div>
                        <div style={{ height: 3, background: 'var(--steel)', borderRadius: 2 }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, (user.territory_size || 0) * 8)}%`,
                                background: `linear-gradient(90deg, ${user.territory_color || '#4a8fa8'}, var(--glow))`,
                                borderRadius: 2,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
                {NAV_ITEMS.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1.25rem',
                            textDecoration: 'none',
                            color: isActive ? 'var(--glow)' : 'var(--text)',
                            background: isActive ? 'rgba(0,229,255,0.07)' : 'transparent',
                            borderLeft: isActive ? '2px solid var(--glow)' : '2px solid transparent',
                            fontSize: '0.95rem', fontWeight: 600,
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s',
                            position: 'relative',
                        })}>
                        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                        <span>{label}</span>
                        {label === 'Wars' && unreadCount > 0 && (
                            <span style={{
                                marginLeft: 'auto',
                                background: 'var(--blood)',
                                color: 'white',
                                borderRadius: '50%',
                                width: 18, height: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontFamily: "'Share Tech Mono', monospace",
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Plan badge + logout */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--steel)' }}>
                {user && (
                    <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.6rem',
                        letterSpacing: '0.2em',
                        marginBottom: '0.75rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ color: 'var(--frost)' }}>PLAN</span>
                        <span style={{
                            padding: '2px 8px',
                            border: '1px solid',
                            borderColor: user.plan === 'free' ? 'var(--steel)' :
                                user.plan === 'warlord' ? 'var(--blood)' :
                                    user.plan === 'emperor' ? 'var(--gold)' : 'rgba(148,103,189,0.7)',
                            color: user.plan === 'free' ? 'var(--frost)' :
                                user.plan === 'warlord' ? 'var(--blood)' :
                                    user.plan === 'emperor' ? 'var(--gold)' : 'rgba(148,103,189,0.9)',
                        }}>
                            {user.plan?.toUpperCase()}
                        </span>
                    </div>
                )}
                <button onClick={handleLogout} className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                    ⏻ Logout
                </button>
            </div>
        </aside>
    );
}