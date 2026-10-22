import React, { useMemo, useState } from 'react';
import {
  CalculatorLayout,
  NumberInput,
  RangeSlider,
  Toggle,
} from './ui';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  buildCompoundYearlySeries,
  futureValueLumpSum,
  futureValueWithContributions,
  type ContributionFrequency,
} from '../utils/financeMath';
import { formatCurrency, formatPercent } from '../utils/format';
import { SavingsGrowthChart } from './charts/SavingsGrowthChart';

export type CompoundMode = 'build-savings' | 'future-value-interest';

export interface CompoundInterestEngineProps {
  title: string;
  mode: CompoundMode;
}

interface ResultRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, emphasis }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 border-b border-slate-200 last:border-b-0">
    <span className="text-sm text-slate-600" style={{ margin: 0 }}>
      {label}
    </span>
    <span
      className={`tabular-nums ${
        emphasis ? 'text-xl font-semibold text-slate-900' : 'text-base font-medium text-slate-800'
      }`}
      style={{ margin: 0 }}
    >
      {value}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Mode: Build Savings (principal + recurring contribution)
// ---------------------------------------------------------------------------

const BuildSavings: React.FC<{ title: string }> = ({ title }) => {
  const [principal, setPrincipal] = useState(1000);
  const [contribution, setContribution] = useState(200);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(20);
  const [compoundDaily, setCompoundDaily] = useState(false);

  const dPrincipal = useDebouncedValue(principal);
  const dContribution = useDebouncedValue(contribution);
  const dRate = useDebouncedValue(rate);
  const dYears = useDebouncedValue(years);

  const summary = useMemo(
    () =>
      futureValueWithContributions({
        principal: dPrincipal,
        contribution: dContribution,
        contributionFrequency: frequency,
        annualRatePercent: dRate,
        years: dYears,
        compoundsPerYear: compoundDaily ? 365 : 12,
      }),
    [dPrincipal, dContribution, frequency, dRate, dYears, compoundDaily],
  );

  const series = useMemo(
    () =>
      buildCompoundYearlySeries({
        principal: dPrincipal,
        contribution: dContribution,
        contributionFrequency: frequency,
        annualRatePercent: dRate,
        years: dYears,
        compoundsPerYear: compoundDaily ? 365 : 12,
      }),
    [dPrincipal, dContribution, frequency, dRate, dYears, compoundDaily],
  );

  return (
    <CalculatorLayout
      title={title}
      description="Project how an initial deposit plus regular contributions can grow over time."
      footer={
        <div>
          <h3
            className="text-sm font-semibold text-slate-700 mb-2"
            style={{ margin: '0 0 0.5rem 0' }}
          >
            Projected growth
          </h3>
          <SavingsGrowthChart data={series} />
        </div>
      }
      inputs={
        <>
          <NumberInput
            label="Starting balance"
            value={principal}
            onChange={setPrincipal}
            min={0}
            step={100}
            prefix="$"
          />
          <NumberInput
            label="Contribution amount"
            value={contribution}
            onChange={setContribution}
            min={0}
            step={25}
            prefix="$"
          />
          <div className="flex flex-col gap-1">
            <span
              className="text-sm font-medium text-slate-700"
              style={{ margin: 0 }}
            >
              Contribution frequency
            </span>
            <div
              className="inline-flex rounded-lg border border-slate-300 overflow-hidden bg-white"
              role="radiogroup"
              aria-label="Contribution frequency"
            >
              {(
                [
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'biweekly', label: 'Bi-weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'annually', label: 'Yearly' },
                ] as const
              ).map((option) => {
                const selected = frequency === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFrequency(option.id)}
                    className={`flex-1 px-3 py-2 text-sm transition-colors ${
                      selected
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                    style={{ margin: 0, border: 0 }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <RangeSlider
            label="Annual rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={20}
            step={0.1}
            formatValue={(v) => formatPercent(v, 1)}
          />
          <RangeSlider
            label="Years to grow"
            value={years}
            onChange={setYears}
            min={1}
            max={50}
            step={1}
            formatValue={(v) => `${v} yr`}
          />
          <Toggle
            label="Compound daily"
            description="Switch between monthly and daily compounding."
            checked={compoundDaily}
            onChange={setCompoundDaily}
          />
        </>
      }
      results={
        <>
          <ResultRow
            label="Future value"
            value={formatCurrency(summary.futureValue)}
            emphasis
          />
          <ResultRow
            label="Total contributions"
            value={formatCurrency(summary.totalContributions)}
          />
          <ResultRow label="Interest earned" value={formatCurrency(summary.totalInterest)} />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Mode: Future Value Interest (lump sum only)
// ---------------------------------------------------------------------------

const FutureValue: React.FC<{ title: string }> = ({ title }) => {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [compoundDaily, setCompoundDaily] = useState(false);

  const dPrincipal = useDebouncedValue(principal);
  const dRate = useDebouncedValue(rate);
  const dYears = useDebouncedValue(years);

  const summary = useMemo(
    () =>
      futureValueLumpSum(
        dPrincipal,
        dRate,
        dYears,
        compoundDaily ? 365 : 12,
      ),
    [dPrincipal, dRate, dYears, compoundDaily],
  );

  const series = useMemo(
    () =>
      buildCompoundYearlySeries({
        principal: dPrincipal,
        contribution: 0,
        annualRatePercent: dRate,
        years: dYears,
        compoundsPerYear: compoundDaily ? 365 : 12,
      }),
    [dPrincipal, dRate, dYears, compoundDaily],
  );

  return (
    <CalculatorLayout
      title={title}
      description="See the projected future value of a one-time deposit."
      footer={
        <div>
          <h3
            className="text-sm font-semibold text-slate-700 mb-2"
            style={{ margin: '0 0 0.5rem 0' }}
          >
            Projected growth
          </h3>
          <SavingsGrowthChart data={series} />
        </div>
      }
      inputs={
        <>
          <NumberInput
            label="Initial deposit"
            value={principal}
            onChange={setPrincipal}
            min={0}
            step={500}
            prefix="$"
          />
          <RangeSlider
            label="Annual rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={20}
            step={0.1}
            formatValue={(v) => formatPercent(v, 1)}
          />
          <RangeSlider
            label="Years"
            value={years}
            onChange={setYears}
            min={1}
            max={50}
            step={1}
            formatValue={(v) => `${v} yr`}
          />
          <Toggle
            label="Compound daily"
            description="Switch between monthly and daily compounding."
            checked={compoundDaily}
            onChange={setCompoundDaily}
          />
        </>
      }
      results={
        <>
          <ResultRow
            label="Future value"
            value={formatCurrency(summary.futureValue)}
            emphasis
          />
          <ResultRow label="Initial deposit" value={formatCurrency(summary.totalContributions)} />
          <ResultRow label="Interest earned" value={formatCurrency(summary.totalInterest)} />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const CompoundInterestEngine: React.FC<CompoundInterestEngineProps> = ({
  title,
  mode,
}) => {
  if (mode === 'future-value-interest') {
    return <FutureValue title={title} />;
  }
  return <BuildSavings title={title} />;
};

export default CompoundInterestEngine;
