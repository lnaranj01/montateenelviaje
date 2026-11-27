import type { HTMLAttributes } from "react";

type TonoInsignia = "neutro" | "planeado" | "completado" | "acento";

interface InsigniaProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoInsignia;
}

const clasesPorTono: Record<TonoInsignia, string> = {
  neutro: "border border-borde bg-fondo-viajes text-texto-suave",
  planeado: "border border-borde bg-fondo-viajes text-planeado",
  completado: "border border-completado/20 bg-green-50 text-green-900",
  acento: "border border-acento/30 bg-amber-50 text-amber-950",
};

export function Insignia({
  children,
  className = "",
  tono = "neutro",
  ...props
}: InsigniaProps) {
  return (
    <span
      {...props}
      className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-bold ${clasesPorTono[tono]} ${className}`}
    >
      {children}
    </span>
  );
}
