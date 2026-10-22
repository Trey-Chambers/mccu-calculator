import React, { useId } from 'react';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Accessible on/off switch — uses role="switch" so screen readers announce
 * state. Keyboard: Space / Enter toggle, matching native checkbox behavior.
 */
export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  description,
  id,
  disabled = false,
}) => {
  const generatedId = useId();
  const inputId = id ?? `mccu-toggle-${generatedId}`;

  const handleKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
          style={{ margin: 0 }}
        >
          {label}
        </label>
        {description ? (
          <span className="text-xs text-slate-500" style={{ margin: 0 }}>
            {description}
          </span>
        ) : null}
      </div>

      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKey}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ margin: 0, padding: 0, border: 0 }}
      >
        <span
          className="inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform"
          style={{
            margin: 0,
            transform: checked ? 'translateX(1.375rem)' : 'translateX(0.125rem)',
          }}
        />
      </button>
    </div>
  );
};

export default Toggle;
