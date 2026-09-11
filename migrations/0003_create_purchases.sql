CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  purchased_at TEXT NOT NULL DEFAULT (date('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
