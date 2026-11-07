ALTER TABLE public.planes_guardados
  ADD COLUMN IF NOT EXISTS origen VARCHAR(160) NOT NULL DEFAULT 'Por definir';

ALTER TABLE public.planes_guardados
  DROP CONSTRAINT IF EXISTS planes_guardados_origen_ok;

ALTER TABLE public.planes_guardados
  ADD CONSTRAINT planes_guardados_origen_ok
  CHECK (char_length(btrim(origen)) BETWEEN 2 AND 160);

ALTER TABLE public.planes_guardados
  ALTER COLUMN origen DROP DEFAULT;
