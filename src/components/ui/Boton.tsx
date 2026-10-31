import type { ButtonHTMLAttributes } from "react";

type VarianteBoton = "primario" | "secundario" | "peligro" | "fantasma";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  cargando?: boolean;
}

const clasesPorVariante: Record<VarianteBoton, string> = {
  primario:
    "border-transparent bg-primario text-white hover:bg-primario/90 disabled:bg-primario/60",
  secundario:
    "border-borde bg-superficie text-texto hover:bg-primario-suave disabled:bg-fondo-viajes",
  peligro:
    "border-transparent bg-peligro text-white hover:bg-peligro/90 disabled:bg-peligro/60",
  fantasma:
    "border-transparent bg-transparent text-current hover:bg-primario-suave/20",
};

export function Boton({
  children,
  className = "",
  cargando = false,
  disabled,
  type = "button",
  variante = "primario",
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-60 ${clasesPorVariante[variante]} ${className}`}
      disabled={disabled || cargando}
      type={type}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-b-transparent"
        />
      )}
      {children}
    </button>
  );
}
