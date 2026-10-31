"use client";

import { useSyncExternalStore } from "react";
import { getOrCreateDeviceId } from "@/lib/deviceId";

let deviceId: string | null = null;
const suscriptores = new Set<() => void>();

function obtenerSnapshot(): string | null {
  return deviceId;
}

function obtenerSnapshotServidor(): null {
  return null;
}

function suscribirse(suscriptor: () => void): () => void {
  suscriptores.add(suscriptor);

  if (typeof window !== "undefined" && deviceId === null) {
    deviceId = getOrCreateDeviceId();
    suscriptores.forEach((notificar) => notificar());
  }

  return () => {
    suscriptores.delete(suscriptor);
  };
}

export function useDeviceId(): string | null {
  return useSyncExternalStore(
    suscribirse,
    obtenerSnapshot,
    obtenerSnapshotServidor,
  );
}
