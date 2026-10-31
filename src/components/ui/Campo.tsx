"use client";

import { useId, type InputHTMLAttributes } from "react";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: string | undefined;
}

export function Campo({
  ayuda,
  className = "",
  error,
  etiqueta,
  id,
  ...props
}: CampoProps) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idError = `${idCampo}-error`;
  const idAyuda = `${idCampo}-ayuda`;
  const descripciones = [
    props["aria-describedby"],
    ayuda ? idAyuda : undefined,
    error ? idError : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-texto" htmlFor={idCampo}>
        {etiqueta}
      </label>
      <input
        {...props}
        aria-describedby={descripciones || undefined}
        aria-invalid={Boolean(error) || undefined}
        className={`min-h-11 rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-texto outline-none placeholder:text-texto-suave focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20 ${error ? "border-peligro" : ""} ${className}`}
        id={idCampo}
      />
      {ayuda && (
        <p className="text-sm text-texto-suave" id={idAyuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p className="text-sm font-medium text-peligro" id={idError}>
          {error}
        </p>
      )}
    </div>
  );
}
