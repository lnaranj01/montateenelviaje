import {
  alternarCompletado,
  cerrarPoolViajes,
  contarViajes,
  crearViaje,
  editarViaje,
  eliminarViaje,
  listarViajes,
  obtenerResumen,
  obtenerViaje,
  type DatosViaje,
} from "@/lib/dataService";

const deviceId = "dev-test-0001";
const otroDeviceId = "dev-test-0002";
const datosCartagena: DatosViaje = {
  destino: "Prueba Cartagena",
  fechaInicio: "2026-12-10",
  fechaFin: "2026-12-15",
  presupuesto: 1_500_000,
};
const datosMedellin: DatosViaje = {
  destino: "Prueba Medellín",
  fechaInicio: "2027-01-15",
  fechaFin: "2027-01-18",
  presupuesto: 900_000,
};

let fallas = 0;
let idCartagena: string | null = null;
let idMedellin: string | null = null;

function exigir(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) {
    throw new Error(mensaje);
  }
}

async function paso(
  nombre: string,
  ejecutar: () => Promise<void>,
): Promise<void> {
  try {
    await ejecutar();
    console.log(`OK ${nombre}`);
  } catch (error) {
    fallas += 1;
    console.error(`FALLA ${nombre}:`, error);
  }
}

async function esperarError(
  ejecutar: () => Promise<unknown>,
  codigoEsperado: string,
): Promise<void> {
  try {
    await ejecutar();
  } catch (error) {
    exigir(
      error instanceof Error &&
        "codigo" in error &&
        error.codigo === codigoEsperado,
      `Se esperaba ${codigoEsperado}.`,
    );
    return;
  }

  throw new Error(`La operación debía fallar con ${codigoEsperado}.`);
}

async function limpiarDispositivo(id: string): Promise<void> {
  const viajes = await listarViajes(id);
  await Promise.all(viajes.map((viaje) => eliminarViaje(id, viaje.id)));
}

async function ejecutarFlujo(): Promise<void> {
  try {
    await limpiarDispositivo(deviceId);
    await limpiarDispositivo(otroDeviceId);

    await paso("1. Contar viajes del dispositivo limpio", async () => {
      exigir(
        (await contarViajes(deviceId)) === 0,
        "El dispositivo no estaba limpio.",
      );
    });

    await paso("2. Crear viaje planeado a Cartagena", async () => {
      const viaje = await crearViaje(deviceId, datosCartagena);
      idCartagena = viaje.id;
      exigir(
        viaje.estado === "Planeado" && !viaje.completado,
        "El viaje no nació planeado.",
      );
    });

    await paso("3. Rechazar fecha final anterior", async () => {
      await esperarError(
        () =>
          crearViaje(deviceId, {
            ...datosCartagena,
            fechaFin: "2026-12-05",
          }),
        "FECHA_FIN_ANTERIOR",
      );
    });

    await paso("4. Rechazar presupuesto negativo", async () => {
      await esperarError(
        () => crearViaje(deviceId, { ...datosCartagena, presupuesto: -1 }),
        "DATOS_INVALIDOS",
      );
    });

    await paso("5. Rechazar destino vacío", async () => {
      await esperarError(
        () => crearViaje(deviceId, { ...datosCartagena, destino: " " }),
        "DATOS_INVALIDOS",
      );
    });

    await paso("6. Listar viajes y contar uno", async () => {
      const viajes = await listarViajes(deviceId);
      exigir(
        viajes.length === 1 && (await contarViajes(deviceId)) === 1,
        "Se esperaba un viaje.",
      );
    });

    await paso("7. Editar el presupuesto del viaje", async () => {
      exigir(idCartagena, "No se creó el viaje de Cartagena.");
      const viaje = await editarViaje(deviceId, idCartagena, {
        ...datosCartagena,
        presupuesto: 2_000_000,
      });
      exigir(
        viaje.presupuesto === 2_000_000,
        "No se guardó el presupuesto editado.",
      );
    });

    await paso("8. Alternar viaje a Completado", async () => {
      exigir(idCartagena, "No se creó el viaje de Cartagena.");
      const viaje = await alternarCompletado(deviceId, idCartagena);
      exigir(
        viaje.estado === "Completado",
        "El estado no cambió a Completado.",
      );
      const completados = await listarViajes(deviceId, {
        estado: "Completado",
      });
      exigir(completados.length === 1, "El filtro de completados no coincide.");
    });

    await paso("9. Reactivar viaje a Planeado", async () => {
      exigir(idCartagena, "No se creó el viaje de Cartagena.");
      const viaje = await alternarCompletado(deviceId, idCartagena);
      exigir(viaje.estado === "Planeado", "El estado no cambió a Planeado.");
    });

    await paso("10. Crear segundo viaje a Medellín", async () => {
      const viaje = await crearViaje(deviceId, datosMedellin);
      idMedellin = viaje.id;
      exigir((await contarViajes(deviceId)) === 2, "Se esperaban dos viajes.");
      const porInicio = await listarViajes(deviceId, { orden: "inicio" });
      const planeados = await listarViajes(deviceId, { estado: "Planeado" });
      exigir(
        porInicio[0]?.destino === datosCartagena.destino &&
          planeados.length === 2,
        "El orden por inicio o el filtro Planeado no coincide.",
      );
    });

    await paso("11. Resumir los viajes del dispositivo", async () => {
      const resumen = await obtenerResumen(deviceId);
      exigir(
        resumen.total === 2 &&
          resumen.planeados === 2 &&
          resumen.completados === 0 &&
          resumen.presupuestoTotal === 2_900_000,
        "El resumen no coincide con los viajes creados.",
      );
    });

    await paso("12. Rechazar un identificador inexistente", async () => {
      await esperarError(
        () => obtenerViaje(deviceId, "00000000-0000-4000-8000-000000000000"),
        "VIAJE_NO_ENCONTRADO",
      );
    });

    await paso("13. Eliminar Cartagena y contar el restante", async () => {
      exigir(idCartagena, "No se creó el viaje de Cartagena.");
      await eliminarViaje(deviceId, idCartagena);
      idCartagena = null;
      exigir((await contarViajes(deviceId)) === 1, "Debía quedar un viaje.");
    });

    await paso("14. Impedir editar un viaje de otro dispositivo", async () => {
      exigir(idMedellin, "No se creó el viaje de Medellín.");
      const viajeMedellinId = idMedellin;
      await esperarError(
        () => editarViaje(otroDeviceId, viajeMedellinId, datosMedellin),
        "VIAJE_NO_ENCONTRADO",
      );
    });
  } catch (error) {
    fallas += 1;
    console.error("FALLA al preparar el flujo de pruebas:", error);
  } finally {
    try {
      await limpiarDispositivo(deviceId);
      await limpiarDispositivo(otroDeviceId);
      console.log("Limpieza de los dispositivos de prueba: OK");
    } catch (error) {
      fallas += 1;
      console.error("FALLA al limpiar los dispositivos de prueba:", error);
    }

    await cerrarPoolViajes();
  }

  console.log(`Total: ${fallas} fallas`);
  if (fallas > 0) {
    process.exitCode = 1;
  }
}

void ejecutarFlujo().catch((error: unknown) => {
  console.error("Error inesperado en el flujo de viajes.", error);
  process.exitCode = 1;
});
