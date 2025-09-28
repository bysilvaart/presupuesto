import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { budgetDB, Movimiento } from '@/db/dexie';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { normalizeMerchant } from '@/lib/rules';

const movimientoImportSchema = z.object({
  fecha: z.string(),
  tipo: z.enum(['Gasto', 'Ingreso', 'Transferencia']).optional(),
  categoria: z.string().optional(),
  comerciante: z.string().optional(),
  monto: z.coerce.number().positive()
});

const columns = ['fecha', 'tipo', 'categoria', 'comerciante', 'monto'] as const;

type ColumnKey = (typeof columns)[number];

const ImportPage = () => {
  const reglas = useLiveQuery(() => budgetDB.comercianteReglas.toArray(), []);
  const [raw, setRaw] = useState<string>('');
  const [mapping, setMapping] = useState<Record<number, ColumnKey>>({});
  const [parsed, setParsed] = useState<Movimiento[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    const data = lines.map((line) => line.split(',').map((value) => value.trim()));
    return data;
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
  };

  const handleFileSystemAccess = async () => {
    if ('showOpenFilePicker' in window) {
      // @ts-expect-error: showOpenFilePicker aún no está tipado
      const [handle] = await window.showOpenFilePicker({ types: [{ accept: { 'text/csv': ['.csv'] } }] });
      const file = await handle.getFile();
      handleFile(file);
    } else {
      setMensaje('Tu navegador no soporta File System Access. Usa el selector tradicional.');
    }
  };

  const aplicarReglas = (movimiento: Movimiento) => {
    if (!reglas) return movimiento;
    if (!movimiento.comerciante) return movimiento;
    const normalized = normalizeMerchant(movimiento.comerciante);
    const match = reglas.find((rule) => normalized.includes(rule.patron));
    if (!match) return movimiento;
    return {
      ...movimiento,
      categoria: movimiento.categoria ?? match.categoriaPorDefecto ?? 'Sin categoría'
    };
  };

  const preview = () => {
    const rows = parseCsv(raw);
    const movimientos: Movimiento[] = [];
    rows.forEach((row) => {
      const fechaRaw = row[mappingReverse(mapping, 'fecha')] ?? '';
      const fecha = parseDate(fechaRaw);
      if (!fecha) return;
      const payload: Partial<Movimiento> = {
        id: uuid(),
        fecha: fecha.toISOString(),
        tipo: (row[mappingReverse(mapping, 'tipo')] as Movimiento['tipo']) ?? 'Gasto',
        categoria: row[mappingReverse(mapping, 'categoria')] ?? 'Sin categoría',
        comerciante: row[mappingReverse(mapping, 'comerciante')],
        monto: Number(row[mappingReverse(mapping, 'monto')] ?? 0),
        mes: fecha.toISOString().slice(0, 7)
      };
      const parsed = movimientoImportSchema.safeParse(payload);
      if (parsed.success) {
        movimientos.push(aplicarReglas(payload as Movimiento));
      }
    });
    setParsed(movimientos);
  };

  const commit = async () => {
    if (parsed.length === 0) {
      setMensaje('No hay datos para importar.');
      return;
    }
    await budgetDB.transaction('rw', budgetDB.movimientos, async () => {
      await budgetDB.movimientos.bulkAdd(parsed.map((mov) => ({ ...mov, id: uuid() })));
    });
    setMensaje(`Importamos ${parsed.length} movimientos.`);
  };

  const rows = raw ? parseCsv(raw).slice(0, 5) : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-100">Importar movimientos</h2>
        <p className="text-sm text-slate-400">
          Usa File System Access para seleccionar archivos repetidos sin abrir el cuadro de diálogo cada vez.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFileSystemAccess}
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Abrir con File System Access
          </button>
          <label className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-within:outline focus-within:outline-2 focus-within:outline-brand">
            <input type="file" accept=".csv" className="sr-only" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />
            Seleccionar CSV
          </label>
        </div>
        {mensaje && (
          <p className="text-xs text-slate-400" role="status" aria-live="polite">
            {mensaje}
          </p>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="space-y-4 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-200">Mapeo de columnas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300" role="grid">
              <thead className="text-slate-400">
                <tr>
                  {rows[0].map((_, index) => (
                    <th key={index} className="p-2">
                      <select
                        value={mapping[index] ?? ''}
                        onChange={(event) =>
                          setMapping((prev) => ({ ...prev, [index]: event.target.value as ColumnKey }))
                        }
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="">Ignorar</option>
                        {columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={preview}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Previsualizar
            </button>
            <ConfirmDialog
              title="Importar movimientos"
              description="Aplicaremos reglas de comerciantes y validaremos los datos."
              onConfirm={commit}
              trigger={
                <button
                  type="button"
                  className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Importar todo
                </button>
              }
            />
          </div>
          {parsed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">Previsualización ({parsed.length})</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {parsed.slice(0, 5).map((mov) => (
                  <li key={mov.id} className="rounded-xl border border-slate-800 bg-slate-900/90 p-2">
                    {new Date(mov.fecha).toLocaleDateString('es-CL')} · {mov.comerciante} · {mov.categoria} · ${mov.monto}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon="📄" title="Sube un CSV" description="Puedes exportar desde tu banco y mapear columnas para importarlas." />
      )}
    </section>
  );
};

function mappingReverse(mapping: Record<number, ColumnKey>, column: ColumnKey) {
  const entry = Object.entries(mapping).find(([, value]) => value === column);
  return entry ? Number(entry[0]) : -1;
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year < 100 ? 2000 + year : year, month - 1, day);
      }
    }
    return null;
  }
  return date;
}

export default ImportPage;
