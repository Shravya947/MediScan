// Creates the tables and loads data/medicines.json. Safe to run many times (upsert).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

(async () => {
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicines.json'), 'utf8'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    for (const m of data.medicines) {
      await client.query(
        `INSERT INTO medicines (id, barcode, name, emoji, uses, side_effects, dosage, rx, purpose)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET barcode=$2, name=$3, emoji=$4, uses=$5,
           side_effects=$6, dosage=$7, rx=$8, purpose=$9, updated_at=now()`,
        [m.id, m.barcode, m.name, m.emoji, m.uses, m.side_effects, m.dosage, m.rx, m.purpose]
      );
    }
    for (const i of data.interactions) {
      await client.query(
        `INSERT INTO interactions (a, b, message) VALUES ($1,$2,$3)
         ON CONFLICT (a, b) DO UPDATE SET message=$3`,
        [i.a, i.b, i.message]
      );
    }
    await client.query('COMMIT');
    console.log(`Seeded ${data.medicines.length} medicines and ${data.interactions.length} interactions.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
