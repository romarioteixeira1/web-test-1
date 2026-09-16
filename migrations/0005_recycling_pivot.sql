ALTER TABLE purchases RENAME TO collections;
ALTER TABLE collections RENAME COLUMN purchased_at TO collected_at;
ALTER TABLE collections RENAME COLUMN delivery_at TO scheduled_at;
ALTER TABLE collections ADD COLUMN type TEXT NOT NULL DEFAULT 'material';
ALTER TABLE collections ADD COLUMN material_type TEXT;
ALTER TABLE collections ADD COLUMN weight_kg REAL;
