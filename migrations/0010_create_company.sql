-- Dados da empresa que usa o app. Sempre uma única linha (id = 1).
CREATE TABLE company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  trade_name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  state_registration TEXT,
  phone TEXT,
  email TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  license_number TEXT,
  license_agency TEXT,
  license_expires_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
