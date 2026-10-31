import { createClient } from "@/lib/supabase/server";
import { ErrorDeNegocio } from "@/lib/reglas/errores";

export type SesionUsuario = {
  email: string;
};

const erroresSinSesion = new Set([
  "AuthSessionMissingError",
  "AuthInvalidJwtError",
  "AuthInvalidCredentialsError",
]);

export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const cliente = await createClient();
  const { data, error } = await cliente.auth.getUser();

  if (error && !erroresSinSesion.has(error.name)) {
    throw error;
  }

  if (!data.user?.email) {
    return null;
  }

  return { email: data.user.email };
}

export async function exigirSesion(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new ErrorDeNegocio("NO_AUTORIZADO");
  }

  return sesion;
}
