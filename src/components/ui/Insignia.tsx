import type { HTMLAttributes } from "react";

type TonoInsignia = "neutro" | "planeado" | "completado" | "acento";

interface InsigniaProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoInsignia;
}

const clasesPorTono: Record<TonoInsignia, string> = {
  neutro: "bg-slate-100 text-slate-800",
  planeado: "bg-slate-100 text-slate-800",
  completado: "bg-green-100 text-green-900",
  acento: "bg-amber-100 text-amber-950",
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
