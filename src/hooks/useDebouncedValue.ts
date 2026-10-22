import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * stillness. Keeps slider / number-input re-renders from thrashing expensive
 * downstream calculations.
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
