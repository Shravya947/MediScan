require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');

const app = express();

app.use(helmet());                                   // safe HTTP headers
const origins = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '10kb' }));            // reject oversized bodies
app.use(rateLimit({ windowMs: 60_000, limit: 120 })); // 120 requests / minute / IP

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (e) {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

app.use('/api', require('./routes'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {                   // never leak internals to the client
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`MediScan API listening on port ${port}`));
