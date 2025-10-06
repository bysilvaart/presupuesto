import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { budgetDB, Movimiento, MovimientoContexto, MovimientoTipo } from '@/db/dexie';
import Numpad from '@/components/ui/Numpad';
import MerchantAutocomplete from '@/components/ui/MerchantAutocomplete';
import CategoryChips from '@/components/ui/CategoryChips';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { formatCLP } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';

const movimientoSchema = z.object({
  monto: z.number().positive(),
  tipo: z.enum(['Gasto', 'Ingreso', 'Transferencia']),
  categoria: z.string().min(2),
  comerciante: z.string().optional(),
  contexto: z.enum(['Casa', 'Trabajo', 'Calle', 'Viaje']).optional(),
  esFijo: z.boolean().optional()
});

const categorias = ['Comida fuera', 'Supermercado', 'Transporte', 'Ocio y suscripciones', 'Arriendo', 'Sueldo'];
const contextos: MovimientoContexto[] = ['Casa', 'Trabajo', 'Calle', 'Viaje'];
const tipos: MovimientoTipo[] = ['Gasto', 'Ingreso', 'Transferencia'];

const QuickAddPage = () => {
  const [monto, setMonto] = useState('0');
  const [categoria, setCategoria] = useState<string>('Comida fuera');
  const [tipo, setTipo] = useState<MovimientoTipo>('Gasto');
  const [comerciante, setComerciante] = useState('');
  const [contexto, setContexto] = useState<MovimientoContexto>('Trabajo');
  const [esFijo, setEsFijo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { enqueue, pendingCount } = useOfflineQueue();
  const reglas = useLiveQuery(() => budgetDB.comercianteReglas.toArray(), []);

  const montoNumber = useMemo(() => Number(monto.replace(/[^0-9]/g, '')) || 0, [monto]);

  useEffect(() => {
    const sharedText = new URLSearchParams(window.location.search).get('texto');
    if (sharedText) {
      setComerciante(sharedText.slice(0, 80));
    }
    if ('launchQueue' in window) {
      // @ts-expect-error: LaunchQueue no tipado todavía en TS
      window.launchQueue?.setConsumer?.((launchParams: any) => {
        if (launchParams.files?.length) {
          setMensaje('Recibimos archivos compartidos. Agrega notas para guardarlos.');
        }
        if (launchParams?.targetURL) {
          const url = new URL(launchParams.targetURL);
          const text = url.searchParams.get('texto');
          if (text) setComerciante(text);
        }
      });
    }
  }, []);

  const onSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const payload = {
      monto: montoNumber,
      tipo,
      categoria,
      comerciante,
      contexto,
      esFijo
    };
    const validation = movimientoSchema.safeParse(payload);
    if (!validation.success) {
      setMensaje('Revisa el monto y la categoría antes de guardar.');
      return;
    }

    const now = new Date();
    const mes = now.toISOString().slice(0, 7);
    const movimiento: Movimiento = {
      id: uuid(),
      fecha: now.toISOString(),
      tipo,
      categoria,
      comerciante,
      contexto,
      esFijo,
      monto: montoNumber,
      mes
    };

    try {
      await budgetDB.movimientos.add(movimiento);
      await enqueue({ type: 'movimiento', payload: movimiento });
      setMensaje('Movimiento guardado ✔️');
      if (!keepData) {
        setMonto('0');
        setComerciante('');
      }
    } catch (error) {
      console.error(error);
      setMensaje('No pudimos guardar ahora. Guardaremos cuando vuelva la conexión.');
    }
  };

  const [keepData, setKeepData] = useState(false);

  const handleNumpadInput = (value: string) => {
    setMonto((prev) => {
      const digits = prev.replace(/[^0-9]/g, '');
      const nextDigits = digits === '0' ? value.replace(/^0+/, '') || '0' : digits + value;
      return formatNumber(nextDigits);
    });
  };

  const handleBackspace = () => {
    setMonto((prev) => {
      const digits = prev.replace(/[^0-9]/g, '');
      const next = digits.slice(0, -1) || '0';
      return formatNumber(next);
    });
  };

  const formatNumber = (value: string) => {
    const number = Number(value);
    return number === 0 ? '0' : new Intl.NumberFormat('es-CL').format(number);
  };

  useEffect(() => {
    if (!comerciante || !reglas) return;
    const normalized = comerciante.toLowerCase().replace(/\s+/g, '');
    const match = reglas.find((rule) => normalized.includes(rule.patron));
    if (match?.categoriaPorDefecto) {
      setCategoria(match.categoriaPorDefecto);
    }
  }, [comerciante, reglas]);

  const tipoButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTipoButton = (index: number) => {
    tipoButtonsRef.current[index]?.focus();
  };

  const handleTipoKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + tipos.length) % tipos.length;
    setTipo(tipos[nextIndex]);
    focusTipoButton(nextIndex);
  };

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-6" aria-label="Agregar movimiento rápido">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
            <div>
              <p className="text-sm text-slate-400">Monto</p>
              <p className="text-4xl font-semibold text-slate-100" aria-live="polite">
                {formatCLP(montoNumber)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de movimiento">
              {tipos.map((option, index) => (
                <button
                  type="button"
                  key={option}
                  role="tab"
                  aria-selected={tipo === option}
                  onClick={() => setTipo(option)}
                  onKeyDown={(event) => handleTipoKeyDown(event, index)}
                  tabIndex={tipo === option ? 0 : -1}
                  ref={(element) => {
                    tipoButtonsRef.current[index] = element;
                  }}
                  className={`rounded-full px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                    tipo === option ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <CategoryChips categories={categorias} value={categoria} onSelect={setCategoria} />
            <MerchantAutocomplete value={comerciante} onChange={setComerciante} />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Contexto">
              {contextos.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setContexto(item)}
                  className={`rounded-full px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                    contexto === item ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={esFijo}
                onChange={(event) => setEsFijo(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Es gasto fijo
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={keepData}
                onChange={(event) => setKeepData(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Guardar y repetir (mantiene comerciante y categoría)
            </label>
          </div>
          <div className="flex flex-col gap-6 lg:max-w-xs">
            <Numpad onInput={handleNumpadInput} onBackspace={handleBackspace} onSubmit={onSubmit} />
          </div>
        </div>
        {mensaje && (
          <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
        {pendingCount > 0 && (
          <p className="text-xs text-slate-400" aria-live="polite">
            {pendingCount} movimientos esperando sincronización.
          </p>
        )}
      </form>
      <EmptyState
        icon="⚡"
        title="Captura ultra rápida"
        description="Escribe o comparte desde cualquier app usando el botón compartir y PresuPWA precargará un borrador."
      />
    </section>
  );
};

export default QuickAddPage;
