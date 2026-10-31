-- M1: tabla de viajes y cierre de acceso público

CREATE TABLE IF NOT EXISTS viajes (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),   -- RN-03
  device_id     VARCHAR(64)   NOT NULL,                                -- agrupa los viajes del dispositivo
  destino       VARCHAR(160)  NOT NULL,
  fecha_inicio  DATE          NOT NULL,
  fecha_fin     DATE          NOT NULL,
  presupuesto   INTEGER       NOT NULL,                                -- pesos enteros
  completado    BOOLEAN       NOT NULL DEFAULT false,                  -- RN-05
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT viajes_destino_minimo   CHECK (char_length(btrim(destino)) >= 2),   -- RN-06
  CONSTRAINT viajes_presupuesto_ok   CHECK (presupuesto >= 0),                   -- RN-02
  CONSTRAINT viajes_fechas_ok        CHECK (fecha_fin >= fecha_inicio)           -- RN-08
);
CREATE INDEX IF NOT EXISTS idx_viajes_device ON viajes (device_id, created_at DESC);

CREATE OR REPLACE FUNCTION viajes_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_viajes_updated_at ON viajes;
CREATE TRIGGER trg_viajes_updated_at BEFORE UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION viajes_actualizar_updated_at();

ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON viajes FROM anon, authenticated;
