import { redirect } from "next/navigation";
import { NavegacionViajes } from "@/components/viajes/NavegacionViajes";
import { obtenerSesion } from "@/lib/auth/sesion";

export default async function LayoutViajes({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-fondo-viajes text-texto">
      <NavegacionViajes email={sesion.email} />
      {children}
    </div>
  );
}
