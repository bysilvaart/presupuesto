import { FormEvent, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { budgetDB, Suscripcion } from '@/db/dexie';
import { derivePrecioMesSuscripcion, formatCLP } from '@/lib/format';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

const schema = z.object({
  servicio: z.string().min(2),
  periodicidad: z.enum(['Mensual', 'Anual']),
  precioCiclo: z.number().positive(),
  categoria: z.enum(['Ocio y suscripciones', 'Trabajo/Freelance', 'Educación y libros']),
  metodoPago: z.string().optional(),
  renuevaEl: z.string(),
  estado: z.enum(['Activa', 'Trial', 'Pausada', 'Cancelar']),
  uso: z.enum(['Alto', 'Medio', 'Bajo']).optional()
});

const defaultValues = {
  servicio: '',
  periodicidad: 'Mensual' as const,
  precioCiclo: 0,
  categoria: 'Ocio y suscripciones' as const,
  metodoPago: '',
  renuevaEl: new Date().toISOString().slice(0, 10),
  estado: 'Activa' as const,
  uso: 'Alto' as const
};

const SuscripcionesPage = () => {
  const suscripciones = useLiveQuery(() => budgetDB.suscripciones.toArray(), []);
  const [form, setForm] = useState({ ...defaultValues });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, precioCiclo: Number(form.precioCiclo) };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setMensaje('Revisa los campos obligatorios.');
      return;
    }
    const now = new Date().toISOString();
    const suscripcion: Suscripcion = {
      id: uuid(),
      servicio: parsed.data.servicio,
      periodicidad: parsed.data.periodicidad,
      precioCiclo: parsed.data.precioCiclo,
      categoria: parsed.data.categoria,
      metodoPago: parsed.data.metodoPago,
      renuevaEl: parsed.data.renuevaEl,
      estado: parsed.data.estado,
      uso: parsed.data.uso,
      ultimoAumento: 0,
      createdAt: now,
      updatedAt: now
    };
    await budgetDB.suscripciones.add(suscripcion);
    setMensaje('Suscripción guardada.');
    setForm({ ...defaultValues });
    // TODO: programar recordatorio Web Push con backend cuando esté disponible.
  };

  const proximasRenovaciones = useMemo(() => {
    if (!suscripciones) return [];
    return [...suscripciones]
      .sort((a, b) => new Date(a.renuevaEl).getTime() - new Date(b.renuevaEl).getTime())
      .slice(0, 5);
  }, [suscripciones]);

  const carasPorMes = useMemo(() => {
    if (!suscripciones) return [];
    return [...suscripciones]
      .map((sus) => ({ ...sus, precioMes: derivePrecioMesSuscripcion(sus) }))
      .sort((a, b) => b.precioMes - a.precioMes)
      .slice(0, 5);
  }, [suscripciones]);

  const registrarCobro = async (sus: Suscripcion) => {
    const now = new Date();
    await budgetDB.movimientos.add({
      id: uuid(),
      fecha: now.toISOString(),
      tipo: 'Gasto',
      categoria: 'Ocio y suscripciones',
      comerciante: sus.servicio,
      canal: 'Online',
      metodo: 'Crédito',
      monto: derivePrecioMesSuscripcion(sus),
      esFijo: true,
      mes: now.toISOString().slice(0, 7),
      suscripcionId: sus.id
    });
    setMensaje('Registro agregado a movimientos.');
  };

  const marcarEstado = async (sus: Suscripcion, estado: Suscripcion['estado']) => {
    await budgetDB.suscripciones.update(sus.id, { estado, updatedAt: new Date().toISOString() });
  };

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Agregar suscripción</h2>
        <label className="text-sm">
          Servicio
          <input
            value={form.servicio}
            onChange={(event) => setForm((prev) => ({ ...prev, servicio: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </label>
        <label className="text-sm">
          Precio ciclo (CLP)
          <input
            type="number"
            inputMode="numeric"
            value={form.precioCiclo}
            onChange={(event) => setForm((prev) => ({ ...prev, precioCiclo: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </label>
        <label className="text-sm">
          Periodicidad
          <select
            value={form.periodicidad}
            onChange={(event) => setForm((prev) => ({ ...prev, periodicidad: event.target.value as Suscripcion['periodicidad'] }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
          </select>
        </label>
        <label className="text-sm">
          Categoría
          <select
            value={form.categoria}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, categoria: event.target.value as Suscripcion['categoria'] }))
            }
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="Ocio y suscripciones">Ocio y suscripciones</option>
            <option value="Trabajo/Freelance">Trabajo/Freelance</option>
            <option value="Educación y libros">Educación y libros</option>
          </select>
        </label>
        <label className="text-sm">
          Método de pago
          <input
            value={form.metodoPago}
            onChange={(event) => setForm((prev) => ({ ...prev, metodoPago: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Renueva el
          <input
            type="date"
            value={form.renuevaEl}
            onChange={(event) => setForm((prev) => ({ ...prev, renuevaEl: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Uso
          <select
            value={form.uso}
            onChange={(event) => setForm((prev) => ({ ...prev, uso: event.target.value as Suscripcion['uso'] }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>
        </label>
        <label className="text-sm">
          Estado
          <select
            value={form.estado}
            onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value as Suscripcion['estado'] }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="Activa">Activa</option>
            <option value="Trial">Trial</option>
            <option value="Pausada">Pausada</option>
            <option value="Cancelar">Cancelar</option>
          </select>
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Guardar suscripción
        </button>
        {mensaje && (
          <p className="text-xs text-slate-400" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
      </form>

      <section className="space-y-4 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Próximas renovaciones</h2>
        {proximasRenovaciones.length === 0 ? (
          <EmptyState icon="🗓" title="Sin renovaciones" description="Agrega tus servicios para recibir recordatorios." />
        ) : (
          <ul className="space-y-3 text-sm">
            {proximasRenovaciones.map((sus) => (
              <li key={sus.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                <div>
                  <p className="font-semibold text-slate-100">{sus.servicio}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(sus.renuevaEl).toLocaleDateString('es-CL')} · {sus.periodicidad} · {formatCLP(derivePrecioMesSuscripcion(sus))}/mes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    onClick={() => registrarCobro(sus)}
                  >
                    Registrar cobro
                  </button>
                  <ConfirmDialog
                    title="Cancelar suscripción"
                    description="¿Seguro que quieres marcarla para cancelación?"
                    onConfirm={() => marcarEstado(sus, 'Cancelar')}
                    trigger={
                      <button
                        type="button"
                        className="rounded-full border border-red-600/60 px-3 py-1 text-xs text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                      >
                        Cancelar
                      </button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Caras por mes</h2>
        {carasPorMes.length === 0 ? (
          <EmptyState icon="💸" title="Sin datos" description="Agrega más suscripciones para ver las más costosas." />
        ) : (
          <ul className="space-y-2 text-sm">
            {carasPorMes.map((sus) => (
              <li key={sus.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                <div>
                  <p className="font-semibold text-slate-100">{sus.servicio}</p>
                  <p className="text-xs text-slate-400">Uso {sus.uso ?? '—'} · {sus.periodicidad}</p>
                </div>
                <span className="text-xs text-slate-300">{formatCLP(derivePrecioMesSuscripcion(sus))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default SuscripcionesPage;
