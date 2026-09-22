CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  material_type_id INTEGER NOT NULL REFERENCES material_types(id),
  transaction_type TEXT NOT NULL DEFAULT 'compra',
  weight REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'a_pagar',
  installments INTEGER,
  transacted_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_transactions_customer ON transactions(customer_id, transacted_at DESC);
CREATE INDEX idx_transactions_material ON transactions(material_type_id);
