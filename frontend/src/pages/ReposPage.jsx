import React, { useEffect, useState } from 'react';
import { reposApi } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const BLANK = {
    name: '', description: '', stars: '', forks: '',
    commits: '', open_issues: '', closed_issues: '',
    contributors: '', language: '',
};

export default function ReposPage() {
    const { user, refreshUser } = useStore();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editRepo, setEditRepo] = useState(null);
    const [form, setForm] = useState(BLANK);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!user) return;
        const res = await reposApi.forUser(user.id);
        setRepos(res.data.repos);
    };

    useEffect(() => { load().finally(() => setLoading(false)); }, [user]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                stars: Number(form.stars) || 0,
                forks: Number(form.forks) || 0,
                commits: Number(form.commits) || 0,
                open_issues: Number(form.open_issues) || 0,
                closed_issues: Number(form.closed_issues) || 0,
                contributors: Number(form.contributors) || 1,
            };
            if (editRepo) {
                await reposApi.update(editRepo.id, payload);
                toast.success('Repository updated!');
            } else {
                await reposApi.create(payload);
                toast.success('Repository added! Territory recalculated.');
            }
            await load();
            await refreshUser();
            setShowForm(false);
            setEditRepo(null);
            setForm(BLANK);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving repo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this repository? This will affect your territory size.')) return;
        try {
            await reposApi.delete(id);
            toast.success('Repository deleted');
            await load();
            await refreshUser();
        } catch { toast.error('Error deleting'); }
    };

    const startEdit = (r) => {
        setForm({
            ...r, stars: r.stars, forks: r.forks, commits: r.commits,
            open_issues: r.open_issues, closed_issues: r.closed_issues, contributors: r.contributors
        });
        setEditRepo(r);
        setShowForm(true);
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '1.5rem', color: 'white', marginBottom: 4 }}>
                        📦 Repositories
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--frost)' }}>
            // {repos.length} REPOS · POWER SCORES UPDATE YOUR TERRITORY
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditRepo(null); setForm(BLANK); }}>
                    + Add Repo
                </button>
            </div>

            {/* Add/Edit form */}
            {showForm && (
                <div style={{
                    background: 'var(--deep)', border: '1px solid var(--steel)',
                    padding: '1.75rem', marginBottom: '1.5rem',
                    animation: 'slideUp 0.3s ease',
                }}>
                    <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '1rem', color: 'var(--glow)', marginBottom: '1.25rem' }}>
                        {editRepo ? '✏️ Edit Repository' : '+ Add Repository'}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label className="label">Repository Name *</label>
                                <input className="input" value={form.name} onChange={set('name')} placeholder="my-awesome-project" required />
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label className="label">Description</label>
                                <input className="input" value={form.description} onChange={set('description')} placeholder="What does this repo do?" />
                            </div>
                            {[
                                { k: 'stars', l: '⭐ Stars', p: '1248' },
                                { k: 'forks', l: '🍴 Forks', p: '120' },
                                { k: 'commits', l: '📝 Commits', p: '450' },
                                { k: 'contributors', l: '👥 Contributors', p: '12' },
                                { k: 'open_issues', l: '🔴 Open Issues', p: '8' },
                                { k: 'closed_issues', l: '✅ Closed Issues', p: '132' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="label">{f.l}</label>
                                    <input className="input" type="number" min="0" value={form[f.k]} onChange={set(f.k)} placeholder={f.p} />
                                </div>
                            ))}
                            <div>
                                <label className="label">Language</label>
                                <input className="input" value={form.language} onChange={set('language')} placeholder="TypeScript" />
                            </div>
                        </div>

                        {/* Power score preview */}
                        <PowerPreview form={form} />

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
                                {editRepo ? 'Update' : 'Add Repository'}
                            </button>
                            <button type="button" className="btn btn-ghost"
                                onClick={() => { setShowForm(false); setEditRepo(null); setForm(BLANK); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Repos list */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <span className="spinner" />
                </div>
            ) : repos.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--steel)', lineHeight: 2.5,
                }}>
                    No repositories yet.<br />Every repo you add expands your territory.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--steel)' }}>
                    {repos.map((r, i) => (
                        <RepoCard key={r.id} repo={r} rank={i + 1} onEdit={() => startEdit(r)} onDelete={() => handleDelete(r.id)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function RepoCard({ repo, rank, onEdit, onDelete }) {
    const pw = repo.power_score || 0;
    const maxPw = 100;
    const pwPct = Math.min(100, (pw / maxPw) * 100);

    return (
        <div style={{ background: 'var(--deep)', padding: '1.5rem', position: 'relative' }}>
            {/* Rank badge */}
            <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
                color: rank === 1 ? 'var(--gold)' : 'var(--frost)',
            }}>
                #{rank}
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                    {repo.name}
                </div>
                {repo.language && (
                    <span className="tag" style={{ color: 'var(--ice)', fontSize: '0.58rem' }}>{repo.language}</span>
                )}
                {repo.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                        {repo.description.slice(0, 80)}{repo.description.length > 80 ? '…' : ''}
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem', marginBottom: '0.75rem' }}>
                {[
                    { l: '★', v: repo.stars.toLocaleString() },
                    { l: '⑂', v: repo.forks.toLocaleString() },
                    { l: 'COMMITS', v: repo.commits.toLocaleString() },
                    { l: 'CONTRIB', v: repo.contributors },
                ].map(s => (
                    <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--frost)' }}>{s.l}</span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--gold)' }}>{s.v}</span>
                    </div>
                ))}
            </div>

            {/* Power bar */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'var(--frost)' }}>POWER SCORE</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--glow)' }}>
                        {pw.toFixed(1)}
                    </span>
                </div>
                <div style={{ height: 3, background: 'var(--steel)', borderRadius: 2 }}>
                    <div style={{
                        height: '100%', width: `${pwPct}%`, borderRadius: 2,
                        background: 'linear-gradient(90deg, var(--frost), var(--glow))',
                        transition: 'width 0.5s',
                    }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={onEdit} style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.45rem' }}>
                    ✏️ Edit
                </button>
                <button onClick={onDelete}
                    style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: 'var(--blood)', padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,57,43,0.1)'}>
                    🗑️
                </button>
            </div>
        </div>
    );
}

function PowerPreview({ form }) {
    const stars = Number(form.stars) || 0;
    const forks = Number(form.forks) || 0;
    const commits = Number(form.commits) || 0;
    const openI = Number(form.open_issues) || 0;
    const closedI = Number(form.closed_issues) || 0;
    const contrib = Number(form.contributors) || 1;

    const normalize = (v, max) => Math.min(100, (v / max) * 100);
    const issueH = openI > 0 ? normalize(closedI, openI + closedI) * 100 : 80;
    const power = (normalize(stars, 300000) * 0.40 + normalize(forks, 50000) * 0.20 +
        normalize(commits, 1000000) * 0.20 + issueH * 0.10 + normalize(contrib, 500) * 0.10);

    if (!stars && !forks && !commits) return null;

    return (
        <div style={{
            background: 'var(--ink)', border: '1px solid var(--steel)',
            padding: '1rem', marginBottom: '0.5rem',
        }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'var(--frost)', marginBottom: '0.5rem' }}>
                ESTIMATED POWER SCORE
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.5rem', color: 'var(--glow)' }}>
                {power.toFixed(1)}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[
                    { l: 'Stars ×0.40', v: (normalize(stars, 300000) * 0.40).toFixed(1) },
                    { l: 'Forks ×0.20', v: (normalize(forks, 50000) * 0.20).toFixed(1) },
                    { l: 'Commits ×0.20', v: (normalize(commits, 1000000) * 0.20).toFixed(1) },
                    { l: 'Health ×0.10', v: (issueH * 0.10).toFixed(1) },
                    { l: 'Community ×0.10', v: (normalize(contrib, 500) * 0.10).toFixed(1) },
                ].map(b => (
                    <div key={b.l}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'var(--frost)' }}>{b.l}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: 'var(--gold)' }}>{b.v}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}