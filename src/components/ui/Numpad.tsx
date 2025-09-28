import { useCallback } from 'react';

interface NumpadProps {
  onInput: (value: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

const Numpad = ({ onInput, onBackspace, onSubmit }: NumpadProps) => {
  const handleClick = useCallback(
    (key: string) => {
      if (key === '⌫') {
        onBackspace();
      } else {
        onInput(key);
      }
    },
    [onBackspace, onInput]
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          className="rounded-2xl bg-slate-900 py-5 text-2xl font-semibold text-slate-100 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          onClick={() => handleClick(key)}
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        onClick={onSubmit}
        className="col-span-3 rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Guardar
      </button>
    </div>
  );
};

export default Numpad;
