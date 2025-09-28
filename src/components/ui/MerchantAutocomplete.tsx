import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { budgetDB } from '@/db/dexie';
import { normalizeMerchant } from '@/lib/rules';

interface MerchantAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

const MerchantAutocomplete = ({ value, onChange }: MerchantAutocompleteProps) => {
  const rules = useLiveQuery(() => budgetDB.comercianteReglas.toArray(), []);

  const suggestions = useMemo(() => {
    if (!rules) return [];
    const normalized = normalizeMerchant(value);
    return rules.filter((rule) => normalized.includes(rule.patron));
  }, [rules, value]);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-300" htmlFor="merchant">
        Comerciante
      </label>
      <input
        id="merchant"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
        }}
        autoComplete="off"
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-lg text-slate-100 placeholder-slate-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
        placeholder="Starbucks, feria, etc."
      />
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2" role="listbox">
          {suggestions.map((rule) => (
            <li key={rule.id} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
              {rule.patron}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MerchantAutocomplete;
