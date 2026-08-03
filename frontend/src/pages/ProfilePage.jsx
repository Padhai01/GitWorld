import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi, authApi } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const BIOMES = ['plains', 'forest', 'desert', 'snow', 'volcanic', 'ocean'];
const COLORS = ['#00e5ff', '#f5c518', '#27ae60', '#ff6b2b', '#c0392b', '#9b59b6', '#4a8fa8', '#d4a843', '#e74c3c', '#3498db'];

export default function ProfilePage() {
    const { username } = useParams();
    const { user: me, refreshUser } = useStore();
    const [profile, setProfile] = useState(null);
    const [repos, setRepos] = useState([]);
    const [wars, setWars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const targetUsername = username || me?.username;
    const isOwnProfile = !username || username === me?.username;

    useEffect(() => {
        if (!targetUsername) return;
        usersApi.getByName(targetUsername).then(r => {
            setProfile(r.data.user);
            setRepos(r.data.repos);
            setWars(r.data.recentWars);
            setForm({
                territory_name: r.data.user.territory_name || '',
                territory_color: r.data.user.territory_color || '#4a8fa8',
                biome: r.data.user.biome || 'plains',
                bio: r.data.user.bio || '',
            });
        }).finally(() => setLoading(false));
    }, [targetUsername]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await authApi.updateProfile(form);
            await refreshUser();
            const r = await usersApi.getByName(targetUsername);
            setProfile(r.data.user);
            setEditing(false);
            toast.success('Profile updated!');
        } catch { toast.error('Error saving'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
    );

    if (!profile) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--steel)', fontFamily: "'Share Tech Mono', monospace" }}>
            User not found.
        </div>
    );

    const winRate = (profile.wars_won + profile.wars_lost) > 0
        ? Math.round(profile.wars_won / (profile.wars_won + profile.wars_lost) * 100) : null;

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '2rem' }}>
            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${profile.territory_color}22, transparent)`,
                border: `1px solid ${profile.territory_color}44`,
                padding: '2rem',
                marginBottom: '1.5rem',
                position: 'relative',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                        width: 72, height: 72,
                        background: `radial-gradient(circle, ${profile.territory_color}66, var(--void))`,
                        border: `3px solid ${profile.territory_color}`,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', flexShrink: 0,
                    }}>
                        {profile.tier === 'superpower' ? '🌌' : profile.tier === 'empire' ? '🌍' :
                            profile.tier === 'kingdom' ? '👑' : profile.tier === 'city_state' ? '🏙️' :
                                profile.tier === 'village' ? '🏘️' : '🏕️'}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '1.5rem', color: 'white' }}>
                            @{profile.username}
                        </div>
                        {profile.territory_name && (
                            <div style={{ color: profile.territory_color, fontSize: '0.9rem', marginTop: 2 }}>
                                {profile.territory_name}
                            </div>
                        )}
                        {profile.bio && (
                            <div style={{ color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                {profile.bio}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={`tier-badge tier-${profile.tier}`}>
                                {profile.tier?.replace('_', '-').toUpperCase()}
                            </span>
                            <span className="tag" style={{ color: 'var(--frost)', fontSize: '0.58rem' }}>
                                {profile.biome?.toUpperCase()} BIOME
                            </span>
                            {profile.plan !== 'free' && (
                                <span className="tag" style={{ color: 'var(--gold)', fontSize: '0.58rem' }}>
                                    {profile.plan?.toUpperCase()} PLAN
                                </span>
                            )}
                            {profile.is_protected && (
                                <span className="tag" style={{ color: 'var(--grass)', fontSize: '0.58rem' }}>🛡️ PROTECTED</span>
                            )}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <button className="btn btn-ghost" onClick={() => setEditing(e => !e)}
                            style={{ alignSelf: 'flex-start' }}>
                            {editing ? '✕ Cancel' : '✏️ Edit'}
                        </button>
                    )}
                </div>
            </div>

            {/* Edit form */}
            {editing && isOwnProfile && (
                <div className="card" style={{ marginBottom: '1.5rem', animation: 'slideUp 0.3s ease' }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--frost)', marginBottom: '1.25rem', letterSpacing: '0.2em' }}>
            // CUSTOMIZE YOUR EMPIRE
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Empire Name</label>
                            <input className="input" value={form.territory_name}
                                onChange={e => setForm(f => ({ ...f, territory_name: e.target.value }))}
                                placeholder="Name your territory" />
                        </div>
                        <div>
                            <label className="label">Bio</label>
                            <input className="input" value={form.bio}
                                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                placeholder="Tell the world about your empire" />
                        </div>
                        <div>
                            <label className="label">Biome</label>
                            <select value={form.biome}
                                onChange={e => setForm(f => ({ ...f, biome: e.target.value }))}
                                style={{ width: '100%', padding: '0.6rem', background: 'var(--ink)', border: '1px solid var(--steel)', color: 'var(--text)' }}>
                                {BIOMES.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Territory Color</label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 4 }}>
                                {COLORS.map(c => (
                                    <div key={c} onClick={() => setForm(f => ({ ...f, territory_color: c }))}
                                        style={{
                                            width: 24, height: 24, borderRadius: '50%', background: c,
                                            cursor: 'pointer',
                                            border: form.territory_color === c ? '2px solid white' : '2px solid transparent',
                                            boxShadow: form.territory_color === c ? `0 0 8px ${c}` : 'none',
                                            transition: 'all 0.15s',
                                        }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
                        Save Changes
                    </button>
                </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1px', background: 'var(--steel)', marginBottom: '1.5rem' }}>
                {[
                    { l: 'Total Stars', v: `★ ${(profile.total_stars || 0).toLocaleString()}`, c: 'var(--gold)' },
                    { l: 'Territory', v: `${(profile.territory_size || 0).toFixed(4)}%`, c: 'var(--glow)' },
                    { l: 'Wars Won', v: profile.wars_won || 0, c: 'var(--grass)' },
                    { l: 'Wars Lost', v: profile.wars_lost || 0, c: 'var(--blood)' },
                    { l: 'Win Rate', v: winRate !== null ? `${winRate}%` : '—', c: 'var(--fire)' },
                    { l: 'Repos', v: repos.length, c: 'var(--ice)' },
                ].map(s => (
                    <div key={s.l} style={{ background: 'var(--deep)', padding: '1rem' }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.1rem', color: s.c }}>{s.v}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--frost)', letterSpacing: '0.1em', marginTop: 2 }}>
                            {s.l.toUpperCase()}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Top repos */}
                <div className="card">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--frost)', letterSpacing: '0.2em', marginBottom: '1rem' }}>
                        TOP REPOSITORIES
                    </div>
                    {repos.slice(0, 5).map((r, i) => (
                        <div key={r.id} className="stat-row">
                            <div>
                                <span style={{ color: 'var(--steel)', fontSize: '0.7rem', marginRight: 6 }}>#{i + 1}</span>
                                <span style={{ color: 'white', fontWeight: 600 }}>{r.name}</span>
                            </div>
                            <span className="stat-val">PWR {r.power_score?.toFixed(0)}</span>
                        </div>
                    ))}
                    {repos.length === 0 && <div style={{ color: 'var(--steel)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem' }}>No repos yet.</div>}
                </div>

                {/* Recent wars */}
                <div className="card">
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--frost)', letterSpacing: '0.2em', marginBottom: '1rem' }}>
                        RECENT WARS
                    </div>
                    {(wars || []).slice(0, 5).map(w => {
                        const won = w.winner_id === profile.id;
                        return (
                            <div key={w.id} className="stat-row">
                                <div style={{ fontSize: '0.85rem' }}>
                                    <span style={{ color: won ? 'var(--grass)' : 'var(--blood)' }}>{won ? '🏆' : '💀'}</span>
                                    <span style={{ color: 'var(--text)', marginLeft: 6 }}>
                                        vs @{w.attacker_id === profile.id ? w.defender_name : w.attacker_name}
                                    </span>
                                </div>
                                <span style={{
                                    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
                                    color: won ? 'var(--grass)' : 'var(--blood)',
                                }}>
                                    {won ? `+${w.territory_gained?.toFixed(3)}%` : `-${w.territory_gained?.toFixed(3)}%`}
                                </span>
                            </div>
                        );
                    })}
                    {(!wars || wars.length === 0) && <div style={{ color: 'var(--steel)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem' }}>No wars yet.</div>}
                </div>
            </div>
        </div>
    );
}