interface EstadoVacioProps {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
}

export function EstadoVacio({ accion, descripcion, titulo }: EstadoVacioProps) {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-borde bg-superficie px-6 py-12 text-center">
      <h3 className="text-lg font-bold text-texto">{titulo}</h3>
      <p className="max-w-lg text-sm leading-6 text-texto-suave">
        {descripcion}
      </p>
      {accion}
    </div>
  );
}
