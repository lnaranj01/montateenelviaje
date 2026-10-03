import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminContext } from '@/lib/auth/admin';

const createUserSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().min(1).max(100),
  password: z.string().min(12).max(128),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  displayName: z.string().trim().min(1).max(100),
  password: z.union([z.literal(''), z.string().min(12).max(128)]).optional(),
});

function accessError(status: number) {
  const message = status === 401 ? 'Inicia sesión para continuar.' : status === 403 ? 'No tienes permisos para administrar usuarios.' : 'Falta configurar la clave de administración en el servidor.';
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const context = await getAdminContext();

  if (!context.ok) {
    return accessError(context.status);
  }

  const { data, error } = await context.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    return NextResponse.json({ error: 'No se pudo cargar la lista de usuarios.' }, { status: 502 });
  }

  const userIds = data.users.map((user) => user.id);
  const { data: profiles, error: profileError } = userIds.length
    ? await context.admin.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [], error: null };

  if (profileError) {
    return NextResponse.json({ error: 'No se pudieron cargar los perfiles.' }, { status: 502 });
  }

  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email ?? '',
    displayName: profileNames.get(user.id) ?? user.user_metadata.full_name ?? '',
    role: user.app_metadata.role === 'admin' ? 'Administrador' : 'Usuario',
    createdAt: user.created_at,
  }));

  return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const context = await getAdminContext();

  if (!context.ok) {
    return accessError(context.status);
  }

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Revisa el correo, nombre y contraseña (mínimo 12 caracteres).' }, { status: 400 });
  }

  const { email, displayName, password } = parsed.data;
  const { data, error } = await context.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName },
    app_metadata: { role: 'user' },
  });

  if (error) {
    return NextResponse.json({ error: 'No se pudo crear la cuenta. Comprueba que el correo no esté registrado.' }, { status: 409 });
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, displayName, role: 'Usuario' },
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getAdminContext();

  if (!context.ok) {
    return accessError(context.status);
  }

  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Revisa los datos del usuario y la contraseña (mínimo 12 caracteres).' }, { status: 400 });
  }

  const { id, email, displayName, password } = parsed.data;
  const { data: current, error: currentError } = await context.admin.auth.admin.getUserById(id);

  if (currentError || !current.user) {
    return NextResponse.json({ error: 'No se encontró el usuario.' }, { status: 404 });
  }

  const { data, error } = await context.admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    ...(password ? { password } : {}),
    user_metadata: { ...current.user.user_metadata, full_name: displayName },
  });

  if (error) {
    return NextResponse.json({ error: 'No se pudieron guardar los cambios del usuario.' }, { status: 400 });
  }

  const { error: profileError } = await context.admin
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', id);

  if (profileError) {
    return NextResponse.json({ error: 'La cuenta se actualizó, pero no se pudo actualizar su perfil.' }, { status: 502 });
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, displayName, role: data.user.app_metadata.role === 'admin' ? 'Administrador' : 'Usuario' },
  });
}