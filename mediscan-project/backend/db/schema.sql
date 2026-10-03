-- MediScan database schema (PostgreSQL 13+)
-- Text fields are JSONB objects keyed by language code, e.g. {"en": "...", "hi": "...", "kn": "..."}
-- so a new language needs no schema change.

CREATE TABLE IF NOT EXISTS medicines (
  id           TEXT PRIMARY KEY,              -- short slug, e.g. 'para'
  barcode      TEXT UNIQUE NOT NULL,          -- EAN-13 / QR payload printed on the pack
  name         TEXT NOT NULL,                 -- e.g. 'Paracetamol 500 mg'
  emoji        TEXT,                          -- simple icon used until real photos are added
  rx           BOOLEAN NOT NULL DEFAULT false,  -- prescription-only medicine
  purpose      TEXT,                          -- group key, e.g. 'bp' (high blood pressure)
  image_url    TEXT,                          -- optional real pack photo
  uses         JSONB NOT NULL,
  side_effects JSONB NOT NULL,
  dosage       JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For databases created before these columns existed:
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS rx BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS medicines_name_lower_idx ON medicines (lower(name));

-- A pair (a, b) means "do not take these together". Store each pair once.
CREATE TABLE IF NOT EXISTS interactions (
  a       TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  b       TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  message JSONB NOT NULL,
  PRIMARY KEY (a, b)
);
