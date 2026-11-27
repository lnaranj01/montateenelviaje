import Link from "next/link";
import { AutenticacionShell } from "@/components/ui/AutenticacionShell";
import FormularioRestablecerContrasena from "./formulario";

type PropsPagina = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function RestablecerContrasenaPage({
  searchParams,
}: PropsPagina) {
  const parametros = await searchParams;
  const token = Array.isArray(parametros.token)
    ? parametros.token[0]
    : parametros.token;

  return (
    <AutenticacionShell
      descripcion="Elige una contraseña nueva para tu cuenta."
      titulo="Crear nueva contraseña"
    >
      {token ? (
        <FormularioRestablecerContrasena token={token} />
      ) : (
        <>
          <p className="mb-6 text-sm text-peligro" role="alert">
            El enlace no es válido o ya venció.
          </p>
          <Link
            className="block text-center text-sm font-semibold text-primario transition hover:text-primario/80"
            href="/recuperar-contrasena"
          >
            Solicitar otro enlace
          </Link>
        </>
      )}
    </AutenticacionShell>
  );
}
