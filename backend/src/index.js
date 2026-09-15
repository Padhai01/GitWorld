import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes        from './routes/auth.js';
import userRoutes        from './routes/users.js';
import repoRoutes        from './routes/repos.js';
import warRoutes         from './routes/wars.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { initDb }        from './utils/db.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/repos',       repoRoutes);
app.use('/api/wars',        warRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'GitWorld API' }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => console.log(`🌍 GitWorld API running on http://localhost:${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
