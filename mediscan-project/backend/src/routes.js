const router = require('express').Router();
const { pool } = require('./db');

// Rename columns to the short keys the app uses: c=code, n=name, e=emoji, u=uses, s=side effects, d=dosage
const COLS = `id, barcode AS c, name AS n, emoji AS e, image_url AS img, rx, purpose AS p,
              uses AS u, side_effects AS s, dosage AS d`;

// Lets async handlers send errors to the central error handler.
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

const isCode = (q) => /^\d{8,14}$/.test(q);
const likeEscape = (q) => q.replace(/[\\%_]/g, '\\$&');
const cleanQ = (v) => String(v || '').trim().slice(0, 100);

// GET /api/medicines/lookup?q=<barcode | name | id>  -> one medicine or 404
router.get('/medicines/lookup', wrap(async (req, res) => {
  const q = cleanQ(req.query.q);
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
  const { rows } = isCode(q)
    ? await pool.query(`SELECT ${COLS} FROM medicines WHERE barcode = $1`, [q])
    : await pool.query(
        `SELECT ${COLS} FROM medicines
         WHERE id = lower($1) OR name ILIKE $2
         ORDER BY name LIMIT 1`,
        [q, `%${likeEscape(q)}%`]
      );
  if (!rows.length) return res.status(404).json({ error: 'Medicine not found', code: isCode(q) ? 'UNVERIFIED' : 'NOT_FOUND' });
  res.json(rows[0]);
}));

// GET /api/medicines/search?q=para -> up to 10 matches (for suggestions)
router.get('/medicines/search', wrap(async (req, res) => {
  const q = cleanQ(req.query.q);
  if (!q) return res.json([]);
  const { rows } = await pool.query(
    `SELECT ${COLS} FROM medicines WHERE name ILIKE $1 ORDER BY name LIMIT 10`,
    [`%${likeEscape(q)}%`]
  );
  res.json(rows);
}));

// GET /api/medicines -> every medicine (lets the app cache the database for offline use)
router.get('/medicines', wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM medicines ORDER BY name LIMIT 500`);
  res.json(rows);
}));

// GET /api/medicines/:id
router.get('/medicines/:id', wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM medicines WHERE id = $1`, [cleanQ(req.params.id).toLowerCase()]);
  if (!rows.length) return res.status(404).json({ error: 'Medicine not found' });
  res.json(rows[0]);
}));

// POST /api/interactions/check   body: { "ids": ["ibu", "asp"] }
router.post('/interactions/check', wrap(async (req, res) => {
  const ids = req.body && req.body.ids;
  if (!Array.isArray(ids) || ids.length > 20 || !ids.every((x) => typeof x === 'string' && x.length < 40)) {
    return res.status(400).json({ error: 'ids must be an array of up to 20 medicine ids' });
  }
  const { rows } = await pool.query(
    'SELECT a, b, message FROM interactions WHERE a = ANY($1) AND b = ANY($1)',
    [ids]
  );
  res.json(rows);
}));

module.exports = router;
