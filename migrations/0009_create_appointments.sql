CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate TEXT NOT NULL UNIQUE,
  description TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'coleta',
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  address TEXT,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  reminder_channel TEXT NOT NULL DEFAULT 'nenhum',
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  reminder_sent_at TEXT,
  reminder_error TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_appointments_date ON appointments(scheduled_date, scheduled_time);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_vehicle ON appointments(vehicle_id, scheduled_date);
