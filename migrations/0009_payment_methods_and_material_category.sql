CREATE TABLE payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'a_vista',
  term_days INTEGER NOT NULL DEFAULT 0,
  use_purchases INTEGER NOT NULL DEFAULT 1,
  use_sales INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mantém os códigos já gravados em customers.payment_method e transactions.payment_method.
INSERT INTO payment_methods (code, name, kind, term_days, use_purchases, use_sales) VALUES
  ('pix', 'Pix', 'a_vista', 0, 1, 1),
  ('dinheiro', 'Dinheiro', 'a_vista', 0, 1, 1),
  ('transferencia', 'Transferência', 'a_vista', 0, 1, 1),
  ('cartao_debito', 'Cartão de débito', 'a_vista', 0, 0, 1),
  ('cartao_credito', 'Cartão de crédito', 'a_prazo', 30, 0, 1);

ALTER TABLE material_types ADD COLUMN category TEXT;

UPDATE material_types SET category = 'Papel' WHERE name IN ('Papelão', 'Papel');
UPDATE material_types SET category = 'Plástico' WHERE name IN ('PET', 'PEAD');
UPDATE material_types SET category = 'Vidro' WHERE name = 'Vidro';
UPDATE material_types SET category = 'Metal' WHERE name IN ('Ferro', 'Alumínio', 'Cobre');
