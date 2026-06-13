# 🌍 GitWorld — Full-Stack Application

> **Every commit. Every star. Every battle. The globe is waiting.**

A browser extension / web app where GitHub stars become land, and repositories wage war.

---

## 🗂️ Project Structure

```
gitworld/
├── backend/                    ← Node.js + Express + SQLite
│   ├── src/
│   │   ├── index.js            ← Express server entry
│   │   ├── middleware/
│   │   │   └── auth.js         ← JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js         ← Register/Login/Profile
│   │   │   ├── users.js        ← User profiles, globe data
│   │   │   ├── repos.js        ← Repository CRUD
│   │   │   ├── wars.js         ← War declaration & battles
│   │   │   └── leaderboard.js  ← Rankings & notifications
│   │   └── utils/
│   │       ├── db.js           ← SQLite connection (better-sqlite3)
│   │       ├── schema.js       ← All table definitions
│   │       ├── battleEngine.js ← War scoring algorithm
│   │       └── seed.js         ← Demo data seeder
│   └── package.json
│
├── frontend/                   ← React 18 + Three.js
│   ├── src/
│   │   ├── App.jsx             ← Router + layout
│   │   ├── index.js            ← React root
│   │   ├── components/
│   │   │   ├── Globe3D.jsx     ← Three.js WebGL globe
│   │   │   └── Sidebar.jsx     ← Navigation sidebar
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx    ← Login / Register
│   │   │   ├── GlobePage.jsx   ← Main globe view
│   │   │   ├── DashboardPage.jsx ← Stats & charts
│   │   │   ├── WarsPage.jsx    ← War room
│   │   │   ├── LeaderboardPage.jsx ← Rankings
│   │   │   ├── ReposPage.jsx   ← Repo management
│   │   │   └── ProfilePage.jsx ← Empire profile
│   │   ├── store/
│   │   │   └── useStore.js     ← Zustand global state
│   │   ├── styles/
│   │   │   └── globals.css     ← Design tokens + utilities
│   │   └── utils/
│   │       └── api.js          ← Axios API client
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** 8+

### 1. Install & Seed Backend

```bash
cd backend
npm install
npm run db:seed     # Creates SQLite DB + seeds demo users
npm run dev         # Starts API on http://localhost:4000
```

### 2. Install & Start Frontend

```bash
# In a new terminal:
cd frontend
npm install
npm start           # Starts React app on http://localhost:3000
```

### 3. Login with demo account

| Field    | Value      |
|----------|------------|
| Username | `you`      |
| Password | `demo1234` |

Or register a new account — you'll start with a **Hamlet** territory and 30-day newcomer protection.

---

## 🗄️ Database Schema

SQLite database at `backend/data/gitworld.db`

| Table             | Purpose                                 |
|-------------------|-----------------------------------------|
| `users`           | Accounts, territory, tier, plan          |
| `repositories`    | Repos with stars/forks/commits/power     |
| `wars`            | War declarations, results, battle logs   |
| `war_cooldowns`   | 1 war/week per opponent enforcement      |
| `alliances`       | Guild/org territory pooling              |
| `alliance_members`| Many-to-many users↔alliances            |
| `notifications`   | In-app alerts for wars, territory changes|
| `globe_events`    | Historical timeline of globe changes     |
| `leaderboard_cache`| Pre-computed rankings                  |

---

## ⚔️ Battle Engine

Located in `backend/src/utils/battleEngine.js`

**Power Score Formula:**
```
POWER = (stars × 0.40) + (forks × 0.20) + (commit_frequency × 0.20)
       + (issue_health × 0.10) + (community_score × 0.10)
```

**Battle rounds (5 rounds, best-of-5):**
1. Stars count
2. Fork count  
3. Commit velocity
4. Issue health (closed / total ratio)
5. Community score (contributors)

**Winner takes:** 5–20% of loser's territory (scales with score differential)

---

## 🌍 Territory Tiers

| Tier        | Stars Required | Globe Size  |
|-------------|---------------|-------------|
| 🏕️ Hamlet   | 0 – 100        | Tiny plot   |
| 🏘️ Village  | 100 – 1K       | Small region|
| 🏙️ City-State| 1K – 10K      | Province    |
| 👑 Kingdom  | 10K – 50K      | Country     |
| 🌍 Empire   | 50K – 100K     | Continent   |
| 🌌 Superpower| 100K+         | Hemisphere  |

---

## 💳 Monetization Plans

| Plan     | Price   | War Limit       | Features                         |
|----------|---------|-----------------|----------------------------------|
| Free     | $0      | 2/month         | Globe view, basic profile        |
| Warlord  | $4/mo   | Unlimited        | Analytics, custom flag           |
| Emperor  | $12/mo  | Unlimited        | Homepage feature, priority rank  |
| Orgs     | $49/mo  | Unlimited        | Team war rooms, corporate branding|

---

## 🔌 API Endpoints

```
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
PATCH /api/auth/profile

GET   /api/users
GET   /api/users/globe
GET   /api/users/:username

GET   /api/repos/user/:userId
POST  /api/repos
PATCH /api/repos/:id
DELETE /api/repos/:id

GET   /api/wars
GET   /api/wars/user/:userId
POST  /api/wars/declare
POST  /api/wars/:id/respond

GET   /api/leaderboard
GET   /api/leaderboard/globe-events
GET   /api/leaderboard/notifications
POST  /api/leaderboard/notifications/read-all
```

---

## 🛡️ Security Features

- **JWT authentication** (7-day expiry)
- **bcrypt** password hashing (10 rounds)
- **Newcomer protection** — new accounts shielded 30 days
- **War cooldown** — 1 war per week per opponent
- **Rate limiting** — 200 req/15min per IP
- **Helmet.js** security headers

---

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express
- SQLite (better-sqlite3) — embedded, zero-config
- JWT + bcrypt auth
- Helmet, CORS, Morgan, rate-limit

**Frontend:**
- React 18
- Three.js — interactive WebGL globe
- Zustand — global state
- Recharts — analytics charts
- React Router v6
- react-hot-toast
- Axios

---

## 🔮 Extension Integration (Future)

To package as a browser extension:
1. Add `manifest.json` (MV3)
2. Build frontend: `npm run build`
3. Sidebar content script injects into `github.com` pages
4. Background service worker handles auth + sync
5. OAuth via GitHub API for real star data

---

*GitWorld — Code is Power. Stars are Land. Repos are Armies.*