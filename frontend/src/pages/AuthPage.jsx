import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const { setUser, setToken } = useStore();
    const navigate = useNavigate();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fn = mode === 'login' ? authApi.login : authApi.register;
            const payload = mode === 'login'
                ? { username: form.username, password: form.password }
                : form;
            const res = await fn(payload);
            setToken(res.data.token);
            setUser(res.data.user);
            toast.success(mode === 'login' ? 'Welcome back, Commander!' : 'Your empire awaits!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = () => setForm({ username: 'you', email: 'you@demo.com', password: 'demo1234' });

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--void)',
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,229,255,0.05) 0%, transparent 70%)',
            padding: '2rem',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Starfield */}
            <Stars />

            <div style={{
                width: '100%', maxWidth: 420,
                background: 'var(--deep)',
                border: '1px solid var(--steel)',
                padding: '2.5rem',
                position: 'relative', zIndex: 1,
                animation: 'slideUp 0.5s ease',
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontFamily: "'Cinzel Decorative', serif",
                        fontSize: '2.5rem',
                        color: 'var(--glow)',
                        textShadow: '0 0 30px rgba(0,229,255,0.4)',
                    }}>GitWorld</div>
                    <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.65rem', color: 'var(--frost)',
                        letterSpacing: '0.3em', marginTop: 4,
                    }}>
                        {mode === 'login' ? '// RETURN TO YOUR EMPIRE' : '// CLAIM YOUR TERRITORY'}
                    </div>
                </div>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 0, marginBottom: '1.75rem', background: 'var(--ink)', padding: 3 }}>
                    {['login', 'register'].map(m => (
                        <button key={m} onClick={() => setMode(m)}
                            style={{
                                flex: 1, padding: '0.5rem',
                                background: mode === m ? 'var(--steel)' : 'transparent',
                                border: 'none', color: mode === m ? 'white' : 'var(--frost)',
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: '0.7rem', letterSpacing: '0.15em',
                                cursor: 'pointer', textTransform: 'uppercase',
                                transition: 'all 0.2s',
                            }}>
                            {m === 'login' ? 'Sign In' : 'Register'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Username</label>
                        <input className="input" value={form.username} onChange={set('username')}
                            placeholder="your_handle" required />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="label">Email</label>
                            <input className="input" type="email" value={form.email} onChange={set('email')}
                                placeholder="commander@realm.dev" required />
                        </div>
                    )}
                    <div>
                        <label className="label">Password</label>
                        <input className="input" type="password" value={form.password} onChange={set('password')}
                            placeholder="••••••••" required minLength={6} />
                    </div>

                    <button type="submit" className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                        disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
                        {mode === 'login' ? '⚔ Enter the Globe' : '🌍 Found My Empire'}
                    </button>
                </form>

                {/* Demo shortcut */}
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                    <button onClick={fillDemo} style={{
                        background: 'none', border: '1px solid var(--steel)',
                        color: 'var(--frost)', fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.65rem', letterSpacing: '0.15em', padding: '0.4rem 1rem',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--glow)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--steel)'}>
                        USE DEMO ACCOUNT
                    </button>
                    <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.58rem', color: 'var(--steel)', marginTop: 6,
                    }}>
                        user: you · pass: demo1234
                    </div>
                </div>

                {/* Security note */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: 'rgba(0,229,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.1)',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.58rem', color: 'var(--frost)',
                    letterSpacing: '0.1em', lineHeight: 1.6,
                }}>
                    🔐 JWT-secured · bcrypt passwords · 30-day newcomer shield active
                </div>
            </div>
        </div>
    );
}

function Stars() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: Math.random() * 2 + 0.5,
                    height: Math.random() * 2 + 0.5,
                    background: 'white',
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.6 + 0.1,
                    animation: `pulse ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
                }} />
            ))}
        </div>
    );
}