import React, { useId } from 'react';

export interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Formatter for the on-screen value readout (e.g. `(v) => \`${v}%\``). */
  formatValue?: (value: number) => string;
  hint?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Labeled range slider with a live numeric readout. Pairs well with
 * useDebouncedValue downstream to keep heavy calculations snappy during drag.
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  hint,
  id,
  disabled = false,
}) => {
  const generatedId = useId();
  const inputId = id ?? `mccu-range-${generatedId}`;

  const safeValue = Number.isFinite(value) ? value : min;
  const display = formatValue ? formatValue(safeValue) : String(safeValue);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
          style={{ margin: 0 }}
        >
          {label}
        </label>
        <span
          className="text-sm font-semibold text-slate-900 tabular-nums"
          style={{ margin: 0 }}
        >
          {display}
        </span>
      </div>

      <input
        id={inputId}
        type="range"
        className="mccu-range w-full"
        style={{
          margin: 0,
          padding: 0,
          appearance: 'none',
          WebkitAppearance: 'none',
          height: '0.5rem',
          background: '#e2e8f0',
          borderRadius: '9999px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        value={safeValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      {hint ? (
        <span className="text-xs text-slate-500" style={{ margin: 0 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};

export default RangeSlider;
