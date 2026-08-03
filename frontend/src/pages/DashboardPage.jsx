import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { reposApi, warsApi, leaderboardApi } from '../utils/api';

// ── Lazy load recharts — it's a heavy library (~500KB) ───────
const BarChart         = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const Bar              = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const XAxis            = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis            = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const Tooltip          = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
const RadarChart       = lazy(() => import('recharts').then(m => ({ default: m.RadarChart })));
const PolarGrid        = lazy(() => import('recharts').then(m => ({ default: m.PolarGrid })));
const PolarAngleAxis   = lazy(() => import('recharts').then(m => ({ default: m.PolarAngleAxis })));
const Radar            = lazy(() => import('recharts').then(m => ({ default: m.Radar })));

// Lazy load entire recharts module at once (more efficient than individual)
let RechartsModule = null;
function useRecharts() {
  const [mod, setMod] = useState(RechartsModule);
  useEffect(() => {
    if (!mod) {
      import('recharts').then(m => { RechartsModule = m; setMod(m); });
    }
  }, []);
  return mod;
}

function ChartLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:100, gap:'0.5rem' }}>
      <div style={{ width:16, height:16, border:'2px solid var(--steel)', borderTopColor:'var(--glow)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <span style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.6rem', color:'var(--frost)' }}>LOADING CHART...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useStore();
  const [repos,  setRepos]  = useState([]);
  const [wars,   setWars]   = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const recharts = useRecharts(); // lazy load recharts when dashboard mounts

  useEffect(() => {
    if (!user) return;
    Promise.all([
      reposApi.forUser(user.id),
      warsApi.forUser(user.id),
      leaderboardApi.notifications(),
    ]).then(([r, w, n]) => {
      setRepos(r.data.repos);
      setWars(w.data.wars);
      setNotifs(n.data.notifications);
    }).finally(() => setLoading(false));
  }, [user]);

  const nextTiers = ['hamlet','village','city_state','kingdom','empire','superpower'];
  const tierThresholds = { hamlet:100, village:1000, city_state:10000, kingdom:50000, empire:100000, superpower:Infinity };
  const currentIdx = nextTiers.indexOf(user?.tier);
  const nextTier   = nextTiers[currentIdx + 1];
  const nextThreshold = tierThresholds[nextTier] || Infinity;
  const progress = nextThreshold === Infinity ? 100
    : Math.min(100, ((user?.total_stars || 0) / nextThreshold) * 100);

  const radarData = repos.slice(0, 1).map(r => ([
    { subject: 'Stars',     A: Math.min(100, (r.stars / 300000) * 100) },
    { subject: 'Forks',     A: Math.min(100, (r.forks / 50000) * 100) },
    { subject: 'Commits',   A: Math.min(100, (r.commits / 1000000) * 100) },
    { subject: 'Health',    A: r.open_issues > 0 ? Math.min(100,(r.closed_issues/(r.open_issues+r.closed_issues))*100) : 80 },
    { subject: 'Community', A: Math.min(100, (r.contributors / 500) * 100) },
  ]))[0] || [];

  const warChartData = [
    { name: 'Won',  val: user?.wars_won  || 0 },
    { name: 'Lost', val: user?.wars_lost || 0 },
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:'1rem' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--steel)', borderTopColor:'var(--glow)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'2rem' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:'2rem' }}>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'1.5rem', color:'white', marginBottom:4 }}>
          Command Center
        </div>
        <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)' }}>
          // @{user?.username} · {user?.territory_name}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1px', background:'var(--steel)', marginBottom:'2rem' }}>
        {[
          { icon:'★',  label:'Total Stars',  val:(user?.total_stars||0).toLocaleString(), color:'var(--gold)' },
          { icon:'🌍', label:'Territory',     val:`${(user?.territory_size||0).toFixed(3)}%`, color:'var(--glow)' },
          { icon:'⚔️', label:'Wars Won',      val:user?.wars_won||0,  color:'var(--grass)' },
          { icon:'💀', label:'Wars Lost',     val:user?.wars_lost||0, color:'var(--blood)' },
          { icon:'📦', label:'Repositories',  val:repos.length,        color:'var(--ice)'  },
          { icon:'🏅', label:'Win Rate',      val:(user?.wars_won+user?.wars_lost)>0
              ? `${Math.round((user?.wars_won/(user?.wars_won+user?.wars_lost))*100)}%`:'—', color:'var(--fire)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--deep)', padding:'1.25rem' }}>
            <div style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>{k.icon}</div>
            <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'1.3rem', color:k.color }}>{k.val}</div>
            <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.58rem', color:'var(--frost)', letterSpacing:'0.15em', marginTop:2 }}>
              {k.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Tier progress */}
        <div className="card">
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)', letterSpacing:'0.2em', marginBottom:'1rem' }}>
            TIER PROGRESSION
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', fontSize:'0.85rem' }}>
            <span style={{ color:'var(--ice)' }}>{user?.tier?.replace('_','-').toUpperCase()}</span>
            {nextTier && <span style={{ color:'var(--frost)' }}>→ {nextTier.replace('_','-').toUpperCase()}</span>}
          </div>
          <div style={{ height:8, background:'var(--steel)', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:4,
              width:`${progress}%`,
              background:`linear-gradient(90deg, ${user?.territory_color||'var(--frost)'}, var(--glow))`,
              transition:'width 1s ease',
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.4rem' }}>
            <span style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.6rem', color:'var(--gold)' }}>
              ★{(user?.total_stars||0).toLocaleString()}
            </span>
            {nextTier && nextThreshold !== Infinity && (
              <span style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.6rem', color:'var(--frost)' }}>
                / ★{nextThreshold.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* War record chart — lazy loaded */}
        <div className="card">
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)', letterSpacing:'0.2em', marginBottom:'1rem' }}>
            WAR RECORD
          </div>
          {recharts ? (
            <recharts.ResponsiveContainer width="100%" height={100}>
              <recharts.BarChart data={warChartData} barSize={40}>
                <recharts.XAxis dataKey="name" tick={{ fill:'var(--frost)', fontSize:11, fontFamily:"'Share Tech Mono', monospace" }} axisLine={false} tickLine={false} />
                <recharts.YAxis hide />
                <recharts.Tooltip contentStyle={{ background:'var(--ink)', border:'1px solid var(--steel)', color:'var(--text)' }} />
                <recharts.Bar dataKey="val" fill="var(--glow)"
                  label={{ position:'top', fill:'var(--gold)', fontFamily:"'Share Tech Mono', monospace", fontSize:12 }}
                  radius={[2,2,0,0]} />
              </recharts.BarChart>
            </recharts.ResponsiveContainer>
          ) : <ChartLoader />}
        </div>
      </div>

      {/* Repos table — lazy loaded with IntersectionObserver */}
      <LazySection>
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)', letterSpacing:'0.2em', marginBottom:'1rem' }}>
            REPOSITORIES — POWER RANKING
          </div>
          {repos.length === 0 ? (
            <div style={{ color:'var(--steel)', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.7rem', padding:'1rem 0' }}>
              No repositories. Add one in the Repositories tab.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--steel)' }}>
                    {['#','Repo','★ Stars','Forks','Commits','Power'].map(h => (
                      <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.6rem', color:'var(--frost)', letterSpacing:'0.15em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {repos.map((r,i) => (
                    <tr key={r.id} style={{ borderBottom:'1px solid rgba(26,45,74,0.5)' }}>
                      <td style={{ padding:'0.5rem 0.75rem', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.75rem', color:'var(--steel)' }}>#{i+1}</td>
                      <td style={{ padding:'0.5rem 0.75rem', color:'white', fontWeight:600 }}>{r.name}</td>
                      <td style={{ padding:'0.5rem 0.75rem', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.8rem', color:'var(--gold)' }}>{r.stars.toLocaleString()}</td>
                      <td style={{ padding:'0.5rem 0.75rem', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.8rem', color:'var(--text)' }}>{r.forks.toLocaleString()}</td>
                      <td style={{ padding:'0.5rem 0.75rem', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.8rem', color:'var(--text)' }}>{r.commits.toLocaleString()}</td>
                      <td style={{ padding:'0.5rem 0.75rem', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.85rem', color:'var(--glow)', fontWeight:700 }}>{r.power_score?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </LazySection>

      {/* Radar chart — lazy loaded when scrolled into view */}
      <LazySection>
        {radarData.length > 0 && recharts && (
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)', letterSpacing:'0.2em', marginBottom:'0.5rem' }}>
              TOP REPO — POWER BREAKDOWN ({repos[0]?.name})
            </div>
            <recharts.ResponsiveContainer width="100%" height={220}>
              <recharts.RadarChart data={radarData}>
                <recharts.PolarGrid stroke="var(--steel)" />
                <recharts.PolarAngleAxis dataKey="subject" tick={{ fill:'var(--frost)', fontSize:11, fontFamily:"'Share Tech Mono', monospace" }} />
                <recharts.Radar dataKey="A" stroke="var(--glow)" fill="var(--glow)" fillOpacity={0.2} />
              </recharts.RadarChart>
            </recharts.ResponsiveContainer>
          </div>
        )}
        {radarData.length > 0 && !recharts && <ChartLoader />}
      </LazySection>

      {/* Notifications — lazy loaded */}
      <LazySection>
        <div className="card">
          <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'0.65rem', color:'var(--frost)', letterSpacing:'0.2em', marginBottom:'1rem' }}>
            RECENT NOTIFICATIONS
          </div>
          {notifs.length === 0 && (
            <div style={{ color:'var(--steel)', fontFamily:"'Share Tech Mono', monospace", fontSize:'0.7rem' }}>No notifications yet.</div>
          )}
          {notifs.slice(0,5).map(n => (
            <div key={n.id} style={{ padding:'0.65rem 0', borderBottom:'1px solid rgba(26,45,74,0.5)', opacity:n.is_read?0.5:1 }}>
              <div style={{ fontSize:'0.9rem', fontWeight:n.is_read?400:600, color:n.is_read?'var(--text)':'white' }}>{n.title}</div>
              <div style={{ fontSize:'0.8rem', color:'var(--text)', marginTop:2 }}>{n.body}</div>
            </div>
          ))}
        </div>
      </LazySection>
    </div>
  );
}

// ── LazySection: renders children only when scrolled into view ──
function LazySection({ children, threshold = 0.1 }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {visible ? children : (
        <div style={{ height:120, background:'var(--deep)', border:'1px solid var(--steel)', marginBottom:'1.5rem',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ChartLoader />
        </div>
      )}
    </div>
  );
}
