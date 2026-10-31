interface ContadorViajesProps {
  total: number;
}

export function ContadorViajes({ total }: ContadorViajesProps) {
  return (
    <p
      aria-live="polite"
      className="text-sm font-semibold text-texto-suave"
      role="status"
    >
      Tienes {total} {total === 1 ? "viaje" : "viajes"}
    </p>
  );
}
