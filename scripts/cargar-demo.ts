import {
  alternarCompletado,
  cerrarPoolViajes,
  crearViaje,
  eliminarViaje,
  listarViajes,
} from "@/lib/dataService";

const deviceId = "dev-demo-0001";

const viajesDemo = [
  {
    destino: "Cartagena",
    fechaInicio: "2027-01-10",
    fechaFin: "2027-01-14",
    presupuesto: 1_800_000,
  },
  {
    destino: "Medellín",
    fechaInicio: "2027-02-05",
    fechaFin: "2027-02-08",
    presupuesto: 950_000,
  },
  {
    destino: "Eje Cafetero",
    fechaInicio: "2027-03-15",
    fechaFin: "2027-03-20",
    presupuesto: 1_250_000,
  },
  {
    destino: "San Andrés",
    fechaInicio: "2027-05-02",
    fechaFin: "2027-05-07",
    presupuesto: 2_400_000,
  },
  {
    destino: "Bogotá",
    fechaInicio: "2027-06-18",
    fechaFin: "2027-06-20",
    presupuesto: 700_000,
  },
] as const;

async function cargarDemostracion(): Promise<void> {
  try {
    const anteriores = await listarViajes(deviceId);
    await Promise.all(
      anteriores.map((viaje) => eliminarViaje(deviceId, viaje.id)),
    );

    for (const [indice, datos] of viajesDemo.entries()) {
      const viaje = await crearViaje(deviceId, datos);

      if (indice === 1 || indice === 3) {
        await alternarCompletado(deviceId, viaje.id);
      }
    }

    const viajes = await listarViajes(deviceId, { orden: "inicio" });
    console.table(
      viajes.map((viaje) => ({
        destino: viaje.destino,
        fechas: `${viaje.fechaInicio} – ${viaje.fechaFin}`,
        presupuesto: viaje.presupuesto,
        estado: viaje.estado,
      })),
    );
  } catch (error) {
    console.error("No se pudieron cargar los viajes de demostración.", error);
    process.exitCode = 1;
  } finally {
    await cerrarPoolViajes();
  }
}

void cargarDemostracion().catch((error: unknown) => {
  console.error("Error inesperado al cargar datos de demostración.", error);
  process.exitCode = 1;
});
