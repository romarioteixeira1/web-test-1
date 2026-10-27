-- Perfil de acesso: só administradores gerenciam usuários. Quem já existe (o dono, criado no primeiro acesso) vira administrador.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin', 'operador'));
UPDATE users SET role = 'admin';
