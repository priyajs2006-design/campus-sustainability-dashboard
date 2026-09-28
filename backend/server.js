'use strict';
/* ============================================================
 * Campus Sustainability Dashboard - EXPRESS APP ENTRY
 * Loads env -> DB pool -> middleware -> routes -> error handler.
 * Does NOT modify schema and does NOT seed data.
 * ========================================================== */
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { pool, ping } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/error');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const energyRoutes = require('./routes/energy');
const waterRoutes = require('./routes/water');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.disable('x-powered-by');
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim())
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

/* ---- health (no DB required for liveness) ---- */
app.get('/api/health', async (req, res) => {
  try {
    const ok = await ping();
    res.json({ status: ok ? 'ok' : 'degraded', db: ok, uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'down', db: false, message: err.message });
  }
});

/* ---- API routes ---- */
const api = express.Router();
api.use('/auth', authRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/energy', energyRoutes);
api.use('/water', waterRoutesonge);
api.use(notFound);
app.use('/api', apionge);

/* ---- error handling (must be last) ---- */
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[server] campus-sustainability API listening on http://127.0.0.1:${PORT}`);
});

/* graceful shutdown: close HTTP, then close the pool */
async function shutdown() {
  console.log('[server] shutting down...');
  try { server.close(); } catch (e) { /* ignore */ }
  try { await pool.end(); } catch (e) { /* ignore */ }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server };
