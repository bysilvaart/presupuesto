import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { budgetDB, IndiceIPC } from '@/db/dexie';
import EmptyState from '@/components/ui/EmptyState';
import { actualizarIndicesDesdeAPI } from '@/lib/ipc';

type TipoIndice = 'IPC' | 'UTM';

const schemaIPC = z.object({
  mes: z.string(),
  valor: z.number().positive(),
  esUltimo: z.boolean().optional()
});

const schemaUTM = z.object({
  mes: z.string(),
  utm: z.number().positive()
});

const parseNumericInput = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const describirCantidad = (cantidad: number, singular: string, plural: string) => {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
};

const obtenerUltimoMesConDato = (lista: IndiceIPC[] | undefined, tipo: 'valor' | 'utm') => {
  if (!lista || lista.length === 0) return null;
  return lista
    .filter((indice) => indice[tipo] !== undefined)
    .reduce<string | null>((max, indice) => {
      if (!max || indice.mes > max) {
        return indice.mes;
      }
      return max;
    }, null);
};

const IndicesPage = () => {
  const indices = useLiveQuery(() => budgetDB.indices.orderBy('mes').reverse().toArray(), []);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoIndice>('IPC');
  const [formIPC, setFormIPC] = useState<{ mes: string; valor: string; esUltimo: boolean }>(() => ({
    mes: new Date().toISOString().slice(0, 7),
    valor: '',
    esUltimo: false
  }));
  const [formUTM, setFormUTM] = useState<{ mes: string; utm: string }>(() => ({
    mes: new Date().toISOString().slice(0, 7),
    utm: ''
  }));
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargandoAPI, setCargandoAPI] = useState(false);
  const [autoSyncIntentado, setAutoSyncIntentado] = useState(false);

  const actualizarDesdeAPI = useCallback(async () => {
    setCargandoAPI(true);
    setMensaje('Consultando API…');
    try {
      const resultado = await actualizarIndicesDesdeAPI();
      if (resultado.procesados === 0) {
        setMensaje('La API no entregó datos recientes. Intenta nuevamente más tarde.');
        return;
      }

      const partes: string[] = [];
      if (resultado.agregados > 0) {
        partes.push(describirCantidad(resultado.agregados, 'mes nuevo', 'meses nuevos'));
      }
      if (resultado.actualizados > 0) {
        partes.push(describirCantidad(resultado.actualizados, 'mes ajustado', 'meses ajustados'));
      }
      if (partes.length === 0) {
        setMensaje('Los valores de IPC y UTM ya estaban actualizados.');
        return;
      }
      setMensaje(`Se sincronizaron ${partes.join(' y ')} desde la CMF.`);
    } catch (error) {
      const descripcion = error instanceof Error ? error.message : 'Error desconocido al consultar la API.';
      setMensaje(descripcion);
    } finally {
      setCargandoAPI(false);
    }
  }, []);

  useEffect(() => {
    if (!indices) return;
    const indice = indices.find((item) => item.mes === formIPC.mes);
    setFormIPC((prev) => ({
      ...prev,
      valor: indice?.valor !== undefined ? String(indice.valor) : '',
      esUltimo: indice?.esUltimo ?? false
    }));
    setFormUTM((prev) => ({
      ...prev,
      utm: indice?.utm !== undefined ? String(indice.utm) : ''
    }));
  }, [indices, formIPC.mes]);

  useEffect(() => {
    if (!indices || autoSyncIntentado) return;

    const mesActual = new Date().toISOString().slice(0, 7);
    const ultimoMesIPC = obtenerUltimoMesConDato(indices, 'valor');
    const ultimoMesUTM = obtenerUltimoMesConDato(indices, 'utm');

    const ipcActualizado = ultimoMesIPC ? ultimoMesIPC >= mesActual : false;
    const utmActualizada = ultimoMesUTM ? ultimoMesUTM >= mesActual : false;

    setAutoSyncIntentado(true);

    if (ipcActualizado && utmActualizada) {
      return;
    }

    actualizarDesdeAPI().catch((error) => {
      console.error('Error al actualizar índices automáticamente', error);
    });
  }, [indices, autoSyncIntentado, actualizarDesdeAPI]);

  const indicesPorTipo = useMemo(() => {
    if (!indices) return [];
    if (tipoSeleccionado === 'IPC') {
      return indices.filter((indice) => indice.valor !== undefined);
    }
    return indices.filter((indice) => indice.utm !== undefined);
  }, [indices, tipoSeleccionado]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (tipoSeleccionado === 'IPC') {
      const valor = parseNumericInput(formIPC.valor);
      const parsed = schemaIPC.safeParse({
        mes: formIPC.mes,
        valor: valor ?? Number.NaN,
        esUltimo: formIPC.esUltimo
      });
      if (!parsed.success) {
        setMensaje('Verifica mes y valor del IPC.');
        return;
      }

      try {
        await budgetDB.transaction('rw', budgetDB.indices, async () => {
          const existente = await budgetDB.indices.get({ mes: parsed.data.mes });
          let objetivoId: string;

          if (existente) {
            await budgetDB.indices.update(existente.id, {
              valor: parsed.data.valor,
              esUltimo: parsed.data.esUltimo
            });
            objetivoId = existente.id;
          } else {
            const nuevo: IndiceIPC = {
              id: uuid(),
              mes: parsed.data.mes,
              valor: parsed.data.valor,
              esUltimo: parsed.data.esUltimo
            };
            await budgetDB.indices.add(nuevo);
            objetivoId = nuevo.id;
          }

          if (parsed.data.esUltimo) {
            await budgetDB.indices
              .filter((item) => item.id !== objetivoId && item.esUltimo)
              .modify({ esUltimo: false });
          }
        });
        setMensaje('Índice IPC guardado.');
      } catch (error) {
        const descripcion = error instanceof Error ? error.message : 'Error desconocido al guardar el IPC.';
        setMensaje(descripcion);
      }
      return;
    }

    const utm = parseNumericInput(formUTM.utm);
    const parsed = schemaUTM.safeParse({
      mes: formUTM.mes,
      utm: utm ?? Number.NaN
    });
    if (!parsed.success) {
      setMensaje('Verifica mes y valor de la UTM.');
      return;
    }

    try {
      const existente = await budgetDB.indices.get({ mes: parsed.data.mes });
      if (!existente) {
        setMensaje('Primero registra el índice IPC de ese mes antes de guardar la UTM.');
        return;
      }
      await budgetDB.indices.update(existente.id, { utm: parsed.data.utm });
      setMensaje('Valor UTM guardado.');
    } catch (error) {
      const descripcion = error instanceof Error ? error.message : 'Error desconocido al guardar la UTM.';
      setMensaje(descripcion);
    }
  };

  const hayDuplicadosUltimo = useMemo(() => {
    if (!indices) return false;
    return indices.filter((indice) => indice.esUltimo).length > 1;
  }, [indices]);

  const cambiarTipo = (tipo: TipoIndice) => {
    setTipoSeleccionado(tipo);
    setMensaje(null);
  };

  const sincronizarMes = (nuevoMes: string) => {
    setFormIPC((prev) => ({ ...prev, mes: nuevoMes }));
    setFormUTM((prev) => ({ ...prev, mes: nuevoMes }));
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-900 bg-slate-900/70 p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Índices</h2>
        <div className="flex rounded-full bg-slate-900/80 p-1">
          {(['IPC', 'UTM'] as const).map((tipo) => {
            const activo = tipoSeleccionado === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => cambiarTipo(tipo)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  activo ? 'bg-brand text-white shadow-soft' : 'text-slate-300 hover:text-white'
                }`}
                aria-pressed={activo}
              >
                {tipo}
              </button>
            );
          })}
        </div>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-100">
          {tipoSeleccionado === 'IPC' ? 'Agregar índice IPC' : 'Registrar valor UTM'}
        </h3>
        <label className="text-sm">
          Mes
          <input
            type="month"
            value={tipoSeleccionado === 'IPC' ? formIPC.mes : formUTM.mes}
            onChange={(event) => sincronizarMes(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        {tipoSeleccionado === 'IPC' ? (
          <>
            <label className="text-sm">
              Valor IPC
              <input
                inputMode="decimal"
                value={formIPC.valor}
                onChange={(event) => setFormIPC((prev) => ({ ...prev, valor: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={formIPC.esUltimo}
                onChange={(event) => setFormIPC((prev) => ({ ...prev, esUltimo: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              Marcar como último índice publicado
            </label>
          </>
        ) : (
          <label className="text-sm">
            Valor UTM
            <input
              inputMode="decimal"
              value={formUTM.utm}
              onChange={(event) => setFormUTM((prev) => ({ ...prev, utm: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {tipoSeleccionado === 'IPC' ? 'Guardar índice IPC' : 'Guardar UTM'}
          </button>
          <button
            type="button"
            onClick={actualizarDesdeAPI}
            disabled={cargandoAPI}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargandoAPI ? 'Actualizando…' : 'Actualizar desde API'}
          </button>
        </div>
        {mensaje && (
          <p className="text-xs text-slate-400" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
        {hayDuplicadosUltimo && tipoSeleccionado === 'IPC' && (
          <p className="text-xs text-orange-400">Hay más de un índice marcado como último.</p>
        )}
      </form>

      <section className="space-y-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-slate-200">
          {tipoSeleccionado === 'IPC' ? 'Historial IPC' : 'Historial UTM'}
        </h3>
        {!indices || indicesPorTipo.length === 0 ? (
          <EmptyState
            icon="📈"
            title="Sin datos"
            description={
              tipoSeleccionado === 'IPC'
                ? 'Agrega los índices IPC de tu fuente preferida.'
                : 'Agrega los valores UTM manualmente o desde la API.'
            }
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {indicesPorTipo.map((indice) => (
              <li key={indice.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
                <div>
                  <p className="font-semibold text-slate-100">{indice.mes}</p>
                  {tipoSeleccionado === 'IPC' ? (
                    <>
                      <p className="text-xs text-slate-400">Valor IPC {indice.valor}</p>
                      {indice.utm !== undefined && (
                        <p className="text-xs text-slate-400">Valor UTM {indice.utm}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400">Valor UTM {indice.utm}</p>
                      {indice.valor !== undefined && (
                        <p className="text-xs text-slate-400">Valor IPC {indice.valor}</p>
                      )}
                    </>
                  )}
                </div>
                {indice.esUltimo && tipoSeleccionado === 'IPC' && (
                  <span className="text-xs text-emerald-300">Último publicado</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default IndicesPage;
