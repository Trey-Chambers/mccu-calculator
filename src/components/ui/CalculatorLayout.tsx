import React from 'react';

export interface CalculatorLayoutProps {
  title: string;
  description?: string;
  inputs: React.ReactNode;
  results: React.ReactNode;
  /** Optional full-width footer slot — e.g. a chart or amortization table. */
  footer?: React.ReactNode;
}

/**
 * Shared chrome for every calculator: title, two-column inputs/results grid,
 * optional full-width footer. All spacing is declared explicitly because the
 * host WordPress theme runs without Tailwind preflight.
 */
export const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({
  title,
  description,
  inputs,
  results,
  footer,
}) => {
  return (
    <section
      className="mccu-calculator w-full max-w-5xl mx-auto p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm"
      style={{ margin: '0 auto' }}
    >
      <header className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-semibold text-slate-900"
          style={{ margin: 0 }}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="mt-2 text-slate-600 text-sm md:text-base"
            style={{ margin: '0.5rem 0 0 0' }}
          >
            {description}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-4">{inputs}</div>
        <div className="flex flex-col gap-4 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl">
          {results}
        </div>
      </div>

      {footer ? <div className="mt-6 md:mt-8">{footer}</div> : null}
    </section>
  );
};

export default CalculatorLayout;
