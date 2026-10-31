export async function mensajeErrorDeRespuesta(
  respuesta: Response,
  mensajeAlternativo: string,
): Promise<string> {
  let cuerpo: unknown;

  try {
    cuerpo = await respuesta.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return "El servidor devolvió una respuesta inválida.";
    }

    throw error;
  }

  if (typeof cuerpo !== "object" || cuerpo === null || !("error" in cuerpo)) {
    return mensajeAlternativo;
  }

  const error = cuerpo.error;
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error &&
    typeof error.mensaje === "string"
  ) {
    return error.mensaje;
  }

  return mensajeAlternativo;
}
