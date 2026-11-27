import type { HTMLAttributes } from "react";

interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Tarjeta({ children, className = "", ...props }: TarjetaProps) {
  return (
    <div
      {...props}
      className={`rounded-lg border border-borde bg-superficie p-5 shadow-[0_8px_24px_rgba(31,41,51,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
