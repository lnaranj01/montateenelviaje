"use client";

const CLAVE_DEVICE_ID = "viajes_device_id";
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateDeviceId(): string {
  const existente = window.localStorage.getItem(CLAVE_DEVICE_ID);

  if (existente && FORMATO_UUID.test(existente)) {
    return existente;
  }

  const deviceId = window.crypto.randomUUID();
  window.localStorage.setItem(CLAVE_DEVICE_ID, deviceId);
  return deviceId;
}
