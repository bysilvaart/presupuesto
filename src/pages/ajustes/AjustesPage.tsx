import { useEffect, useState } from 'react';

interface Ajustes {
  caps: {
    fijos: number;
    variables: number;
    sinking: number;
  };
  metaAhorro: number;
  pin?: string;
}

const defaultAjustes: Ajustes = {
  caps: {
    fijos: 600000,
    variables: 400000,
    sinking: 150000
  },
  metaAhorro: 20,
  pin: ''
};

const AjustesPage = () => {
  const [ajustes, setAjustes] = useState<Ajustes>({ ...defaultAjustes, caps: { ...defaultAjustes.caps } });
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ajustes');
    if (stored) {
      const parsed = JSON.parse(stored);
      setAjustes({ ...defaultAjustes, ...parsed, caps: { ...defaultAjustes.caps, ...parsed.caps } });
    }
  }, []);

  const guardar = () => {
    localStorage.setItem('ajustes', JSON.stringify(ajustes));
    setMensaje('Ajustes guardados localmente.');
  };

  const limpiarPIN = () => {
    setAjustes((prev) => ({ ...prev, pin: '' }));
    localStorage.removeItem('ajustes-pin');
  };

  useEffect(() => {
    if (ajustes.pin) {
      localStorage.setItem('ajustes-pin', ajustes.pin);
    }
  }, [ajustes.pin]);

  return (
    <section className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Caps mensuales</h2>
        <label className="text-sm">
          Fijos
          <input
            inputMode="numeric"
            value={ajustes.caps.fijos}
            onChange={(event) => setAjustes((prev) => ({ ...prev, caps: { ...prev.caps, fijos: Number(event.target.value) } }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Variables
          <input
            inputMode="numeric"
            value={ajustes.caps.variables}
            onChange={(event) =>
              setAjustes((prev) => ({ ...prev, caps: { ...prev.caps, variables: Number(event.target.value) } }))
            }
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-sm">
          Sinking funds
          <input
            inputMode="numeric"
            value={ajustes.caps.sinking}
            onChange={(event) => setAjustes((prev) => ({ ...prev, caps: { ...prev.caps, sinking: Number(event.target.value) } }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Meta de ahorro</h2>
        <label className="text-sm">
          % mensual
          <input
            inputMode="numeric"
            value={ajustes.metaAhorro}
            onChange={(event) => setAjustes((prev) => ({ ...prev, metaAhorro: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Seguridad</h2>
        <label className="text-sm">
          PIN local
          <input
            inputMode="numeric"
            value={ajustes.pin}
            onChange={(event) => setAjustes((prev) => ({ ...prev, pin: event.target.value.slice(0, 6) }))}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <button
          type="button"
          onClick={limpiarPIN}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Limpiar PIN
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={guardar}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Guardar ajustes
        </button>
        <button
          type="button"
          onClick={() => {
            setAjustes({ ...defaultAjustes, caps: { ...defaultAjustes.caps } });
            setMensaje('Restauramos valores por defecto.');
          }}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Restaurar
        </button>
      </div>
      {mensaje && (
        <p className="text-xs text-slate-400" role="status" aria-live="polite">
          {mensaje}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Las copias locales se guardan en IndexedDB y puedes exportarlas desde Importar.
      </p>
    </section>
  );
};

export default AjustesPage;
