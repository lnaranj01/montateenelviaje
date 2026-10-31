import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type UsuarioRecuperacion = {
  id: string;
  correo: string;
};

export type RestablecimientoVigente = {
  token_id: string;
  usuario_id: string;
};

const usuariosPorPagina = 1000;

export async function buscarUsuarioPorCorreo(
  correo: string,
): Promise<UsuarioRecuperacion | null> {
  const cliente = createAdminClient();
  const correoNormalizado = correo.trim().toLowerCase();
  let pagina = 1;

  while (true) {
    const { data, error } = await cliente.auth.admin.listUsers({
      page: pagina,
      perPage: usuariosPorPagina,
    });

    if (error) {
      throw error;
    }

    const usuario = data.users.find(
      (candidato) => candidato.email?.toLowerCase() === correoNormalizado,
    );

    if (usuario?.email) {
      return { id: usuario.id, correo: usuario.email };
    }

    if (data.users.length < usuariosPorPagina) {
      return null;
    }

    pagina += 1;
  }
}

export async function contarSolicitudesRecientes(
  usuarioId: string,
): Promise<number> {
  const { data, error } = await createAdminClient().rpc(
    "contar_solicitudes_restablecimiento",
    {
      p_usuario_id: usuarioId,
    },
  );

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}

export async function invalidarTokensPendientes(
  usuarioId: string,
): Promise<void> {
  const { error } = await createAdminClient().rpc(
    "invalidar_solicitudes_restablecimiento",
    {
      p_usuario_id: usuarioId,
    },
  );

  if (error) {
    throw error;
  }
}

export async function crearTokenRecuperacion(
  usuarioId: string,
  tokenHash: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "crear_solicitud_restablecimiento",
    {
      p_usuario_id: usuarioId,
      p_token_hash: tokenHash,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function buscarTokenVigente(
  tokenHash: string,
): Promise<RestablecimientoVigente | null> {
  const { data, error } = await createAdminClient().rpc(
    "buscar_restablecimiento_vigente",
    {
      p_token_hash: tokenHash,
    },
  );

  if (error) {
    throw error;
  }

  const tokens = data as RestablecimientoVigente[] | null;
  return tokens?.[0] ?? null;
}

export async function marcarTokenComoUsado(tokenId: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "marcar_restablecimiento_usado",
    {
      p_token_id: tokenId,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function actualizarContrasena(
  usuarioId: string,
  contrasena: string,
): Promise<void> {
  const { error } = await createAdminClient().auth.admin.updateUserById(
    usuarioId,
    { password: contrasena },
  );

  if (error) {
    throw error;
  }
}

export {
  alternarCompletado,
  cerrarPoolViajes,
  contarViajes,
  crearViaje,
  editarViaje,
  eliminarViaje,
  listarViajes,
  obtenerResumen,
  obtenerViaje,
} from "@/lib/datos/viajes";
export type {
  DatosViaje,
  FiltrosListadoViajes,
  ResumenViajes,
  Viaje,
} from "@/lib/datos/tipos";
export async function obtenerSesion(): Promise<{ email: string } | null> {
  const { obtenerSesion: consultarSesion } = await import("@/lib/auth/sesion");
  return consultarSesion();
}
