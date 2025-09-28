import { FormEvent, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { budgetDB, Obligacion } from '@/db/dexie';
import { calcularAjusteIPC } from '@/lib/ipc';
import { formatCLP } from '@/lib/format';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

const schema = z.object({
  nombre: z.string().min(2),
  tipo: z.enum(['Pensión', 'Arriendo indexado', 'Otro']),
  base: z.number().positive(),
  mesBase: z.string(),
  indiceBase: z.number().positive(),
  fechaPago: z.string()
});

const ObligacionesPage = () => {
  const obligaciones = useLiveQuery(() => budgetDB.obligaciones.toArray(), []);
  const indices = useLiveQuery(() => budgetDB.indices.toArray(), []);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'Pensión' as const,
    base: 0,
    mesBase: new Date().toISOString().slice(0, 7),
    indiceBase: 100,
    fechaPago: new Date().toISOString().slice(0, 10)
  });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, base: Number(form.base), indiceBase: Number(form.indiceBase) };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setMensaje('Completa los campos obligatorios.');
      return;
    }
    const obligacion: Obligacion = {
      id: uuid(),
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      base: parsed.data.base,
      mesBase: parsed.data.mesBase,
      indiceBase: parsed.data.indiceBase,
      fechaPago: parsed.data.fechaPago,
      pagado: false
    };
    await budgetDB.obligaciones.add(obligacion);
    setMensaje('Obligación guardada.');
    setForm((prev) => ({ ...prev, nombre: '', base: 0 }));
  };

  const pendientes = useMemo(() => {
    if (!obligaciones) return [];
    return obligaciones.filter((obl) => !obl.pagado);
  }, [obligaciones]);

  const historico = useMemo(() => {
    if (!obligaciones) return [];
    return obligaciones.filter((obl) => obl.pagado);
  }, [obligaciones]);

  const generarPago = async (obligacion: Obligacion) => {
    const mesActual = new Date().toISOString().slice(0, 7);
    const indiceActual = indices?.find((indice) => indice.mes === mesActual)?.valor ?? obligacion.indiceActual;
    const monto = calcularAjusteIPC(obligacion.base, obligacion.indiceBase, indiceActual);
    const now = new Date();
    await budgetDB.movimientos.add({
      id: uuid(),
      fecha: now.toISOString(),
      tipo: 'Gasto',
      categoria: obligacion.tipo,
      comerciante: obligacion.nombre,
      monto,
      esFijo: true,
      mes: now.toISOString().slice(0, 7),
      obligacionId: obligacion.id
    });
    await budgetDB.obligaciones.update(obligacion.id, { pagado: true, indiceActual });
    setMensaje('Pago generado como movimiento.');
  };

  const actualizarIndiceActual = async (obligacion: Obligacion) => {
    const ultimo = indices?.find((indice) => indice.esUltimo) ?? indices?.at(-1);
    if (!ultimo) return;
    await budgetDB.obligaciones.update(obligacion.id, { indiceActual: ultimo.valor });
  };

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Nueva obligación</h2>
        <label className="text-sm">
          Nombre
          <input
            value={form.nombre}
            onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Tipo
          <select
            value={form.tipo}
            onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value as Obligacion['tipo'] }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="Pensión">Pensión</option>
            <option value="Arriendo indexado">Arriendo indexado</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <label className="text-sm">
          Base (CLP)
          <input
            inputMode="numeric"
            value={form.base}
            onChange={(event) => setForm((prev) => ({ ...prev, base: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Mes base
          <input
            type="month"
            value={form.mesBase}
            onChange={(event) => setForm((prev) => ({ ...prev, mesBase: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Índice base
          <input
            inputMode="numeric"
            value={form.indiceBase}
            onChange={(event) => setForm((prev) => ({ ...prev, indiceBase: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Fecha de pago
          <input
            type="date"
            value={form.fechaPago}
            onChange={(event) => setForm((prev) => ({ ...prev, fechaPago: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Guardar obligación
        </button>
        {mensaje && (
          <p className="text-xs text-slate-400" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
      </form>

      <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Pendientes del mes</h2>
        {pendientes.length === 0 ? (
          <EmptyState icon="📥" title="Sin pendientes" description="Ya registraste todos los pagos indexados." />
        ) : (
          <ul className="space-y-3 text-sm">
            {pendientes.map((obl) => {
              const montoAjustado = calcularAjusteIPC(obl.base, obl.indiceBase, obl.indiceActual);
              return (
                <li key={obl.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                  <div>
                    <p className="font-semibold text-slate-100">{obl.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {formatCLP(montoAjustado)} · {new Date(obl.fechaPago).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                      onClick={() => actualizarIndiceActual(obl)}
                    >
                      Actualizar IPC
                    </button>
                    <ConfirmDialog
                      title="Generar pago"
                      description="Crear un movimiento con el monto ajustado"
                      onConfirm={() => generarPago(obl)}
                      trigger={
                        <button
                          type="button"
                          className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          Generar pago
                        </button>
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Histórico</h2>
        {historico.length === 0 ? (
          <EmptyState icon="📦" title="Aún sin historial" description="Genera pagos para verlos aquí." />
        ) : (
          <ul className="space-y-2 text-sm">
            {historico.map((obl) => (
              <li key={obl.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                <div>
                  <p className="font-semibold text-slate-100">{obl.nombre}</p>
                  <p className="text-xs text-slate-400">{new Date(obl.fechaPago).toLocaleDateString('es-CL')}</p>
                </div>
                <span className="text-xs text-emerald-300">Pagado</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default ObligacionesPage;
