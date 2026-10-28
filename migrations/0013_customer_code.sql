-- Código do cliente (ex.: CLI-0001), usado para achar o cliente nas transações e coletas.
-- Coluna gerada a partir do id: nasce sozinha no cadastro, vale para quem já existe e nunca muda.
ALTER TABLE customers ADD COLUMN code TEXT GENERATED ALWAYS AS (printf('CLI-%04d', id)) VIRTUAL;
