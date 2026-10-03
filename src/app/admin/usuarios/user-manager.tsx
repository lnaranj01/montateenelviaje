'use client';

import { useEffect, useState, type FormEvent } from 'react';

type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

type UserForm = {
  email: string;
  displayName: string;
  password: string;
};

const emptyForm: UserForm = { email: '', displayName: '', password: '' };

async function getUsers() {
  const response = await fetch('/api/admin/users', { cache: 'no-store' });
  const result = await response.json();
  return { response, result };
}

export default function UserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadUsers() {
    setIsLoading(true);
    setError('');

    try {
      const { response, result } = await getUsers();
      if (!response.ok) {
        setError(result.error ?? 'No se pudo cargar la lista.');
        return;
      }
      setUsers(result.users);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    void getUsers()
      .then(({ response, result }) => {
        if (!isActive) {
          return;
        }
        if (!response.ok) {
          setError(result.error ?? 'No se pudo cargar la lista.');
          return;
        }
        setUsers(result.users);
      })
      .catch(() => {
        if (isActive) {
          setError('No se pudo conectar con el servidor.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function startCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setNotice('');
    setIsFormOpen(true);
  }

  function startEdit(user: ManagedUser) {
    setEditingUser(user);
    setForm({ email: user.email, displayName: user.displayName, password: '' });
    setError('');
    setNotice('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');

    const payload = {
      ...(editingUser ? { id: editingUser.id } : {}),
      email: form.email.trim(),
      displayName: form.displayName.trim(),
      password: form.password,
    };

    try {
      const response = await fetch('/api/admin/users', {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'No se pudieron guardar los cambios.');
        return;
      }

      closeForm();
      setNotice(editingUser ? 'Cambios guardados.' : 'Usuario creado.');
      await loadUsers();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    `${user.email} ${user.displayName}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Buscar usuarios</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o correo"
            type="search"
            value={query}
          />
        </label>
        <button
          className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          onClick={startCreate}
          type="button"
        >
          Nuevo usuario
        </button>
      </div>

      {notice && <p className="mb-4 text-sm text-emerald-300" role="status">{notice}</p>}
      {error && <p className="mb-4 text-sm text-rose-300" role="alert">{error}</p>}

      {isFormOpen && (
        <form className="mb-8 grid gap-4 border-y border-slate-800 py-6 sm:grid-cols-2" onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold text-white sm:col-span-2">
            {editingUser ? 'Editar usuario' : 'Crear usuario'}
          </h2>
          <label className="grid gap-1.5 text-sm text-slate-300">
            Nombre
            <input
              autoComplete="name"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
              maxLength={100}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              required
              value={form.displayName}
            />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-300">
            Correo electrónico
            <input
              autoComplete="email"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-300 sm:col-span-2">
            {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
            <input
              autoComplete="new-password"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
              minLength={12}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editingUser}
              type="password"
              value={form.password}
            />
          </label>
          {error && <p className="text-sm text-rose-300 sm:col-span-2" role="alert">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button
              className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
              onClick={closeForm}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border-y border-slate-800">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3 font-semibold">Usuario</th>
              <th className="px-3 py-3 font-semibold">Correo</th>
              <th className="px-3 py-3 font-semibold">Acceso</th>
              <th className="px-3 py-3 font-semibold">Alta</th>
              <th className="px-3 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="text-slate-300">
                <td className="px-3 py-4 font-medium text-white">{user.displayName || 'Sin nombre'}</td>
                <td className="px-3 py-4">{user.email}</td>
                <td className="px-3 py-4">{user.role}</td>
                <td className="px-3 py-4">{new Date(user.createdAt).toLocaleDateString('es')}</td>
                <td className="px-3 py-4 text-right">
                  <button
                    className="font-semibold text-cyan-300 hover:text-cyan-200"
                    onClick={() => startEdit(user)}
                    type="button"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && filteredUsers.length === 0 && (
              <tr>
                <td className="px-3 py-10 text-center text-slate-500" colSpan={5}>
                  {users.length ? 'No hay resultados.' : 'Aún no hay usuarios.'}
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td className="px-3 py-10 text-center text-slate-500" colSpan={5}>Cargando usuarios…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}