import { FormEvent, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { budgetDB, IndiceIPC } from '@/db/dexie';
import EmptyState from '@/components/ui/EmptyState';
import { actualizarIndicesDesdeAPI } from '@/lib/ipc';

const schema = z.object({
  mes: z.string(),
  valor: z.number().positive(),
  esUltimo: z.boolean().optional()
});

const IndicesPage = () => {
  const indices = useLiveQuery(() => budgetDB.indices.orderBy('mes').reverse().toArray(), []);
  const [form, setForm] = useState({ mes: new Date().toISOString().slice(0, 7), valor: 100, esUltimo: false });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ ...form, valor: Number(form.valor) });
    if (!parsed.success) {
      setMensaje('Verifica mes y valor.');
      return;
    }
    const indice: IndiceIPC = {
      id: uuid(),
      mes: parsed.data.mes,
      valor: parsed.data.valor,
      esUltimo: parsed.data.esUltimo
    };
    await budgetDB.indices.add(indice);
    if (indice.esUltimo) {
      await budgetDB.indices
        .filter((item) => item.id !== indice.id && item.esUltimo)
        .modify({ esUltimo: false });
    }
    setMensaje('Índice guardado.');
  };

  const hayDuplicadosUltimo = useMemo(() => {
    if (!indices) return false;
    return indices.filter((indice) => indice.esUltimo).length > 1;
  }, [indices]);

  const actualizarDesdeAPI = async () => {
    setMensaje('Consultando API…');
    const nuevos = await actualizarIndicesDesdeAPI();
    // TODO: reemplazar con carga real desde API externa.
    if (nuevos.length === 0) {
      setMensaje('API aún no configurada. Usa carga manual.');
    }
  };

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Agregar índice IPC</h2>
        <label className="text-sm">
          Mes
          <input
            type="month"
            value={form.mes}
            onChange={(event) => setForm((prev) => ({ ...prev, mes: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Valor
          <input
            inputMode="decimal"
            value={form.valor}
            onChange={(event) => setForm((prev) => ({ ...prev, valor: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.esUltimo}
            onChange={(event) => setForm((prev) => ({ ...prev, esUltimo: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900"
          />
          Marcar como último índice publicado
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Guardar índice
          </button>
          <button
            type="button"
            onClick={actualizarDesdeAPI}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            Actualizar desde API
          </button>
        </div>
        {mensaje && (
          <p className="text-xs text-slate-400" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
        {hayDuplicadosUltimo && (
          <p className="text-xs text-orange-400">Hay más de un índice marcado como último.</p>
        )}
      </form>

      <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Historial de índices</h2>
        {!indices || indices.length === 0 ? (
          <EmptyState icon="📈" title="Sin datos" description="Agrega los índices IPC de tu fuente preferida." />
        ) : (
          <ul className="space-y-2 text-sm">
            {indices.map((indice) => (
              <li key={indice.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                <div>
                  <p className="font-semibold text-slate-100">{indice.mes}</p>
                  <p className="text-xs text-slate-400">Valor {indice.valor}</p>
                </div>
                {indice.esUltimo && <span className="text-xs text-emerald-300">Último publicado</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default IndicesPage;
