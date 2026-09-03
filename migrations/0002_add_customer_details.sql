ALTER TABLE customers ADD COLUMN birth_date TEXT;
ALTER TABLE customers ADD COLUMN complement TEXT;
ALTER TABLE customers ADD COLUMN neighborhood TEXT;
ALTER TABLE customers ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
