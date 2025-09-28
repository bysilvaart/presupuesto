import { useState } from 'react';
import { formatISO, parseISO } from 'date-fns';

const toMonth = (date: Date) => formatISO(date, { representation: 'date' }).slice(0, 7);

export const useMonth = () => {
  const [month, setMonth] = useState(() => toMonth(new Date()));

  return {
    month,
    setMonth,
    next: () => {
      const [year, monthIndex] = month.split('-').map(Number);
      const nextDate = new Date(year, monthIndex, 1);
      setMonth(toMonth(nextDate));
    },
    prev: () => {
      const [year, monthIndex] = month.split('-').map(Number);
      const prevDate = new Date(year, monthIndex - 2, 1);
      setMonth(toMonth(prevDate));
    },
    parse: (value: string) => {
      try {
        const parsed = parseISO(`${value}-01`);
        setMonth(toMonth(parsed));
      } catch (error) {
        console.error('Error al parsear mes', error);
      }
    }
  };
};
