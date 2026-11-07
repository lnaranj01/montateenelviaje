CREATE TABLE IF NOT EXISTS public.planes_guardados (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     VARCHAR(64)   NOT NULL,
  destino       VARCHAR(160)  NOT NULL,
  fecha_inicio  DATE          NOT NULL,
  fecha_fin     DATE          NOT NULL,
  presupuesto   BIGINT        NOT NULL,
  viajeros      SMALLINT      NOT NULL,
  servicios     JSONB         NOT NULL,
  total         BIGINT        NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT planes_guardados_destino_ok
    CHECK (char_length(btrim(destino)) BETWEEN 2 AND 160),
  CONSTRAINT planes_guardados_fechas_ok
    CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT planes_guardados_presupuesto_ok
    CHECK (presupuesto > 0),
  CONSTRAINT planes_guardados_viajeros_ok
    CHECK (viajeros BETWEEN 1 AND 4),
  CONSTRAINT planes_guardados_servicios_ok
    CHECK (
      CASE
        WHEN jsonb_typeof(servicios) = 'array'
          THEN jsonb_array_length(servicios) BETWEEN 1 AND 5
        ELSE FALSE
      END
    ),
  CONSTRAINT planes_guardados_total_ok
    CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_planes_guardados_device_created
  ON public.planes_guardados (device_id, created_at DESC);

ALTER TABLE public.planes_guardados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.planes_guardados FROM anon, authenticated;
