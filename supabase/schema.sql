-- ============================================================
-- Floricultura — Schema Supabase
-- Execute este arquivo em: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tabela: products ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  estoque_atual    INTEGER     NOT NULL DEFAULT 0,
  valor            DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque_minimo   INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário acessa apenas seus produtos"
  ON products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Tabela: sellers ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  contato          TEXT        NOT NULL DEFAULT '',
  regiao           TEXT        NOT NULL DEFAULT '',
  ativo            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário acessa apenas seus vendedores"
  ON sellers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Tabela: allocations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id        UUID        NOT NULL REFERENCES sellers(id)  ON DELETE CASCADE,
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantidade       INTEGER     NOT NULL,
  preco_unitario   DECIMAL(10,2) NOT NULL,  -- preço travado no momento da alocação
  data             DATE        NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT        NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário acessa apenas suas alocações"
  ON allocations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Tabela: settlements ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  allocation_id        UUID        NOT NULL REFERENCES allocations(id)  ON DELETE CASCADE,
  seller_id            UUID        NOT NULL REFERENCES sellers(id)      ON DELETE CASCADE,
  product_id           UUID        NOT NULL REFERENCES products(id)     ON DELETE CASCADE,
  preco_unitario       DECIMAL(10,2) NOT NULL,  -- preço na época da alocação
  quantidade_alocada   INTEGER     NOT NULL,
  quantidade_vendida   INTEGER     NOT NULL,
  quantidade_devolvida INTEGER     NOT NULL,
  valor_recebido       DECIMAL(10,2) NOT NULL,
  valor_esperado       DECIMAL(10,2) NOT NULL,
  diferenca            DECIMAL(10,2) NOT NULL,
  data                 DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário acessa apenas seus acertos"
  ON settlements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Trigger: seta user_id automaticamente no INSERT ─────────
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_products_user_id
  BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER trg_sellers_user_id
  BEFORE INSERT ON sellers FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER trg_allocations_user_id
  BEFORE INSERT ON allocations FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER trg_settlements_user_id
  BEFORE INSERT ON settlements FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ── Trigger: atualiza updated_at automaticamente ────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_sellers_updated_at
  BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Índices para performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_user_id       ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id        ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_user_id    ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_seller_id  ON allocations(seller_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status     ON allocations(status);
CREATE INDEX IF NOT EXISTS idx_settlements_user_id    ON settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_seller_id  ON settlements(seller_id);
