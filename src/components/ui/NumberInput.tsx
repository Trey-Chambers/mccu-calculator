import React, { useId } from 'react';

export interface NumberInputProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Accessible labeled number field with optional prefix/suffix adornments.
 * Writes clamped, finite numbers back to the parent so downstream math never
 * sees NaN. Styles reset margins/borders explicitly (preflight is off).
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  hint,
  id,
  disabled = false,
}) => {
  const generatedId = useId();
  const inputId = id ?? `mccu-num-${generatedId}`;

  const handleChange = (raw: string) => {
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    let next = parsed;
    if (typeof min === 'number' && next < min) next = min;
    if (typeof max === 'number' && next > max) next = max;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-700"
        style={{ margin: 0 }}
      >
        {label}
      </label>

      <div
        className={`flex items-stretch border rounded-lg bg-white overflow-hidden ${
          disabled ? 'border-slate-200 opacity-60' : 'border-slate-300 focus-within:border-slate-500'
        }`}
      >
        {prefix ? (
          <span
            className="flex items-center px-3 bg-slate-100 text-slate-600 text-sm border-r border-slate-200 select-none"
            style={{ margin: 0 }}
          >
            {prefix}
          </span>
        ) : null}

        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          className="flex-1 min-w-0 px-3 py-2 text-base text-slate-900 bg-transparent outline-none"
          style={{
            margin: 0,
            border: 0,
            appearance: 'textfield',
            MozAppearance: 'textfield',
          }}
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
        />

        {suffix ? (
          <span
            className="flex items-center px-3 bg-slate-100 text-slate-600 text-sm border-l border-slate-200 select-none"
            style={{ margin: 0 }}
          >
            {suffix}
          </span>
        ) : null}
      </div>

      {hint ? (
        <span className="text-xs text-slate-500" style={{ margin: 0 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};

export default NumberInput;
