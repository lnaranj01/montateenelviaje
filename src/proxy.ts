import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { responderError } from "./lib/http/respuestas";
import { ErrorDeNegocio } from "./lib/reglas/errores";
import { getSupabaseConfig } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(cacheHeaders).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const ruta = request.nextUrl.pathname;
  const esRutaApiViajes =
    ruta === "/api/viajes" || ruta.startsWith("/api/viajes/");
  const esPaginaViajes = ruta === "/viajes" || ruta.startsWith("/viajes/");

  if ((esRutaApiViajes || esPaginaViajes) && error) {
    if (
      ![
        "AuthSessionMissingError",
        "AuthInvalidJwtError",
        "AuthInvalidCredentialsError",
      ].includes(error.name)
    ) {
      return responderError(error);
    }
  }

  if ((esRutaApiViajes || esPaginaViajes) && !data?.claims?.sub) {
    if (esRutaApiViajes) {
      return responderError(new ErrorDeNegocio("NO_AUTORIZADO"));
    }

    const urlLogin = new URL("/login", request.url);
    const respuesta = NextResponse.redirect(urlLogin);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      respuesta.cookies.set(cookie);
    }
    return respuesta;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/viajes/:path*",
    "/api/viajes/:path*",
  ],
};
