ALTER TABLE customers ADD COLUMN person_type TEXT NOT NULL DEFAULT 'fisica';
ALTER TABLE customers ADD COLUMN company_name TEXT;
ALTER TABLE customers ADD COLUMN state_registration TEXT;
ALTER TABLE customers ADD COLUMN relationship_type TEXT NOT NULL DEFAULT 'comprador';
ALTER TABLE customers ADD COLUMN payment_method TEXT;
