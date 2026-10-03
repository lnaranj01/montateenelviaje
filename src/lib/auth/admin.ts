import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type AdminContext =
  | { ok: true; user: User; admin: SupabaseClient }
  | { ok: false; status: 401 | 403 | 503 };

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false, status: 401 };
  }

  if (data.user.app_metadata.role !== 'admin') {
    return { ok: false, status: 403 };
  }

  try {
    return { ok: true, user: data.user, admin: createAdminClient() };
  } catch {
    return { ok: false, status: 503 };
  }
}