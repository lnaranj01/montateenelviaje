import type { HTMLAttributes } from "react";

type TipoAviso = "informacion" | "error" | "exito";

interface AvisoProps extends HTMLAttributes<HTMLDivElement> {
  tipo?: TipoAviso;
}

const clasesPorTipo: Record<TipoAviso, string> = {
  informacion: "border-primario/30 bg-primario-suave text-primario",
  error: "border-peligro/30 bg-red-50 text-red-900",
  exito: "border-completado/30 bg-green-50 text-green-900",
};

export function Aviso({
  children,
  className = "",
  tipo = "informacion",
  ...props
}: AvisoProps) {
  return (
    <div
      {...props}
      className={`rounded-lg border px-4 py-3 text-sm ${clasesPorTipo[tipo]} ${className}`}
      role={tipo === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
