interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MonthPicker = ({ value, onChange }: MonthPickerProps) => (
  <div className="space-y-1">
    <label htmlFor="month-picker" className="block text-sm font-medium text-slate-300">
      Mes
    </label>
    <input
      id="month-picker"
      type="month"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
    />
  </div>
);

export default MonthPicker;
