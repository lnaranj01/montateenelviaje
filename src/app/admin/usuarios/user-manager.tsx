"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";

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

const emptyForm: UserForm = { email: "", displayName: "", password: "" };

async function getUsers() {
  const response = await fetch("/api/admin/users", { cache: "no-store" });
  const result = await response.json();
  return { response, result };
}

export default function UserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const { response, result } = await getUsers();
      if (!response.ok) {
        setError(result.error ?? "No se pudo cargar la lista.");
        return;
      }
      setUsers(result.users);
    } catch {
      setError("No se pudo conectar con el servidor.");
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
          setError(result.error ?? "No se pudo cargar la lista.");
          return;
        }
        setUsers(result.users);
      })
      .catch(() => {
        if (isActive) {
          setError("No se pudo conectar con el servidor.");
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
    setError("");
    setNotice("");
    setIsFormOpen(true);
  }

  function startEdit(user: ManagedUser) {
    setEditingUser(user);
    setForm({ email: user.email, displayName: user.displayName, password: "" });
    setError("");
    setNotice("");
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
    setError("");
    setNotice("");

    const payload = {
      ...(editingUser ? { id: editingUser.id } : {}),
      email: form.email.trim(),
      displayName: form.displayName.trim(),
      password: form.password,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudieron guardar los cambios.");
        return;
      }

      closeForm();
      setNotice(editingUser ? "Cambios guardados." : "Usuario creado.");
      await loadUsers();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    `${user.email} ${user.displayName}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Buscar usuarios</span>
          <input
            className="min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 py-2.5 text-sm text-texto placeholder:text-texto-suave shadow-sm outline-none transition focus:border-primario focus:ring-2 focus:ring-primario/15"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o correo"
            type="search"
            value={query}
          />
        </label>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primario px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-60"
          onClick={startCreate}
          type="button"
        >
          Nuevo usuario
        </button>
      </div>

      {notice && <Aviso tipo="exito">{notice}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}

      {isFormOpen && (
        <form
          className="grid gap-4 rounded-xl border border-borde bg-superficie p-5 shadow-sm sm:grid-cols-2 sm:p-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-lg font-bold text-texto sm:col-span-2">
            {editingUser ? "Editar usuario" : "Crear usuario"}
          </h2>
          <label className="grid gap-2 text-sm font-semibold text-texto">
            Nombre
            <input
              autoComplete="name"
              className="min-h-11 rounded-lg border border-borde bg-fondo-viajes px-3 py-2.5 text-texto outline-none transition focus:border-primario focus:ring-2 focus:ring-primario/15"
              maxLength={100}
              onChange={(event) =>
                setForm({ ...form, displayName: event.target.value })
              }
              required
              value={form.displayName}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-texto">
            Correo electrónico
            <input
              autoComplete="email"
              className="min-h-11 rounded-lg border border-borde bg-fondo-viajes px-3 py-2.5 text-texto outline-none transition focus:border-primario focus:ring-2 focus:ring-primario/15"
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-texto sm:col-span-2">
            {editingUser ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
            <input
              autoComplete="new-password"
              className="min-h-11 rounded-lg border border-borde bg-fondo-viajes px-3 py-2.5 text-texto outline-none transition focus:border-primario focus:ring-2 focus:ring-primario/15"
              minLength={12}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required={!editingUser}
              type="password"
              value={form.password}
            />
          </label>
          {error && (
            <Aviso className="sm:col-span-2" tipo="error">
              {error}
            </Aviso>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button
              className="min-h-11 rounded-lg bg-primario px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
            <button
              className="min-h-11 rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold text-texto transition hover:border-primario hover:bg-primario-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
              onClick={closeForm}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-borde bg-superficie shadow-sm">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-primario-suave text-xs uppercase text-primario">
            <tr>
              <th className="px-3 py-3 font-semibold">Usuario</th>
              <th className="px-3 py-3 font-semibold">Correo</th>
              <th className="px-3 py-3 font-semibold">Acceso</th>
              <th className="px-3 py-3 font-semibold">Alta</th>
              <th className="px-3 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t border-borde text-texto-suave transition-colors hover:bg-fondo-viajes"
              >
                <td className="px-3 py-4 font-semibold text-texto">
                  {user.displayName || "Sin nombre"}
                </td>
                <td className="px-3 py-4">{user.email}</td>
                <td className="px-3 py-4">{user.role}</td>
                <td className="px-3 py-4">
                  {new Date(user.createdAt).toLocaleDateString("es")}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    className="font-bold text-primario hover:text-primario/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
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
                <td
                  className="px-3 py-10 text-center text-texto-suave"
                  colSpan={5}
                >
                  {users.length ? "No hay resultados." : "Aún no hay usuarios."}
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td
                  className="px-3 py-10 text-center text-texto-suave"
                  colSpan={5}
                >
                  Cargando usuarios…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
