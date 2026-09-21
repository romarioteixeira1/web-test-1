CREATE TABLE material_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES material_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_material_types_parent ON material_types(parent_id);

CREATE TABLE material_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_type_id INTEGER NOT NULL REFERENCES material_types(id) ON DELETE CASCADE,
  buy_price REAL NOT NULL,
  sell_price REAL NOT NULL,
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_material_prices_type ON material_prices(material_type_id, effective_at DESC);

INSERT INTO material_types (name, unit) VALUES
  ('Papelão', 'kg'),
  ('Papel', 'kg'),
  ('PET', 'kg'),
  ('PEAD', 'kg'),
  ('Vidro', 'kg'),
  ('Ferro', 'kg'),
  ('Alumínio', 'kg'),
  ('Cobre', 'kg');
