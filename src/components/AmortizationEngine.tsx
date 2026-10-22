import React, { useMemo, useState } from 'react';
import {
  CalculatorLayout,
  NumberInput,
  RangeSlider,
} from './ui';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  buildAmortizationSchedule,
  buildAmortizationYearlySeries,
  calculatePrincipal,
  compareBiWeekly,
  compareRefinance,
} from '../utils/financeMath';
import { formatCurrency, formatMonths, formatPercent } from '../utils/format';
import { PrincipalInterestChart } from './charts/PrincipalInterestChart';

export type AmortizationMode =
  | 'loan-payment'
  | 'how-much-loan-can-i-afford'
  | 'home-refinance'
  | 'bi-weekly-mortgage';

export interface AmortizationEngineProps {
  title: string;
  mode: AmortizationMode;
}

interface ResultRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, emphasis }) => (
  <div
    className={`flex items-baseline justify-between gap-4 py-2 border-b border-slate-200 last:border-b-0`}
  >
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

const ChartSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3
      className="text-sm font-semibold text-slate-700 mb-2"
      style={{ margin: '0 0 0.5rem 0' }}
    >
      {title}
    </h3>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Mode: Loan Payment
// ---------------------------------------------------------------------------

const LoanPayment: React.FC<{ title: string }> = ({ title }) => {
  const [principal, setPrincipal] = useState(25000);
  const [rate, setRate] = useState(7.5);
  const [termMonths, setTermMonths] = useState(60);

  const debouncedPrincipal = useDebouncedValue(principal);
  const debouncedRate = useDebouncedValue(rate);
  const debouncedTerm = useDebouncedValue(termMonths);

  const summary = useMemo(
    () => buildAmortizationSchedule(debouncedPrincipal, debouncedRate, debouncedTerm),
    [debouncedPrincipal, debouncedRate, debouncedTerm],
  );
  const series = useMemo(() => buildAmortizationYearlySeries(summary), [summary]);

  return (
    <CalculatorLayout
      title={title}
      description="Estimate your monthly payment, total interest, and payoff cost."
      footer={
        <ChartSection title="Principal vs. interest over time">
          <PrincipalInterestChart data={series} />
        </ChartSection>
      }
      inputs={
        <>
          <NumberInput
            label="Loan amount"
            value={principal}
            onChange={setPrincipal}
            min={0}
            step={500}
            prefix="$"
          />
          <RangeSlider
            label="Interest rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={25}
            step={0.125}
            formatValue={(v) => formatPercent(v)}
          />
          <RangeSlider
            label="Term"
            value={termMonths}
            onChange={setTermMonths}
            min={6}
            max={420}
            step={6}
            formatValue={(v) => formatMonths(v)}
          />
        </>
      }
      results={
        <>
          <ResultRow label="Monthly payment" value={formatCurrency(summary.monthlyPayment)} emphasis />
          <ResultRow label="Total interest" value={formatCurrency(summary.totalInterest)} />
          <ResultRow label="Total of payments" value={formatCurrency(summary.totalPaid)} />
          <ResultRow label="Payoff time" value={formatMonths(summary.schedule.length)} />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Mode: Affordability
// ---------------------------------------------------------------------------

const Affordability: React.FC<{ title: string }> = ({ title }) => {
  const [payment, setPayment] = useState(400);
  const [rate, setRate] = useState(7.5);
  const [termMonths, setTermMonths] = useState(60);

  const dPayment = useDebouncedValue(payment);
  const dRate = useDebouncedValue(rate);
  const dTerm = useDebouncedValue(termMonths);

  const maxPrincipal = useMemo(
    () => calculatePrincipal(dPayment, dRate, dTerm),
    [dPayment, dRate, dTerm],
  );

  const summary = useMemo(
    () => buildAmortizationSchedule(maxPrincipal, dRate, dTerm),
    [maxPrincipal, dRate, dTerm],
  );
  const series = useMemo(() => buildAmortizationYearlySeries(summary), [summary]);

  return (
    <CalculatorLayout
      title={title}
      description="See the largest loan amount your target monthly payment can support."
      footer={
        <ChartSection title="Principal vs. interest over time">
          <PrincipalInterestChart data={series} />
        </ChartSection>
      }
      inputs={
        <>
          <NumberInput
            label="Target monthly payment"
            value={payment}
            onChange={setPayment}
            min={0}
            step={25}
            prefix="$"
          />
          <RangeSlider
            label="Interest rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={25}
            step={0.125}
            formatValue={(v) => formatPercent(v)}
          />
          <RangeSlider
            label="Term"
            value={termMonths}
            onChange={setTermMonths}
            min={6}
            max={420}
            step={6}
            formatValue={(v) => formatMonths(v)}
          />
        </>
      }
      results={
        <>
          <ResultRow label="Maximum loan amount" value={formatCurrency(maxPrincipal)} emphasis />
          <ResultRow label="Monthly payment" value={formatCurrency(summary.monthlyPayment)} />
          <ResultRow label="Total interest" value={formatCurrency(summary.totalInterest)} />
          <ResultRow label="Total of payments" value={formatCurrency(summary.totalPaid)} />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Mode: Refinance
// ---------------------------------------------------------------------------

const Refinance: React.FC<{ title: string }> = ({ title }) => {
  const [currentBalance, setCurrentBalance] = useState(180000);
  const [currentRate, setCurrentRate] = useState(6.75);
  const [remainingMonths, setRemainingMonths] = useState(276);
  const [newRate, setNewRate] = useState(5.5);
  const [newTermMonths, setNewTermMonths] = useState(360);
  const [closingCosts, setClosingCosts] = useState(3500);

  const dCurrentBalance = useDebouncedValue(currentBalance);
  const dCurrentRate = useDebouncedValue(currentRate);
  const dRemaining = useDebouncedValue(remainingMonths);
  const dNewRate = useDebouncedValue(newRate);
  const dNewTerm = useDebouncedValue(newTermMonths);
  const dClosing = useDebouncedValue(closingCosts);

  const result = useMemo(
    () =>
      compareRefinance({
        currentBalance: dCurrentBalance,
        currentRate: dCurrentRate,
        remainingMonths: dRemaining,
        newRate: dNewRate,
        newTermMonths: dNewTerm,
        closingCosts: dClosing,
      }),
    [dCurrentBalance, dCurrentRate, dRemaining, dNewRate, dNewTerm, dClosing],
  );

  const newLoanSummary = useMemo(
    () => buildAmortizationSchedule(dCurrentBalance, dNewRate, dNewTerm),
    [dCurrentBalance, dNewRate, dNewTerm],
  );
  const series = useMemo(
    () => buildAmortizationYearlySeries(newLoanSummary),
    [newLoanSummary],
  );

  return (
    <CalculatorLayout
      title={title}
      description="Compare your current mortgage with a proposed refinance to see monthly and lifetime savings."
      footer={
        <ChartSection title="New loan: principal vs. interest">
          <PrincipalInterestChart data={series} />
        </ChartSection>
      }
      inputs={
        <>
          <NumberInput
            label="Current balance"
            value={currentBalance}
            onChange={setCurrentBalance}
            min={0}
            step={1000}
            prefix="$"
          />
          <RangeSlider
            label="Current rate"
            value={currentRate}
            onChange={setCurrentRate}
            min={0}
            max={15}
            step={0.125}
            formatValue={(v) => formatPercent(v)}
          />
          <RangeSlider
            label="Months remaining"
            value={remainingMonths}
            onChange={setRemainingMonths}
            min={12}
            max={420}
            step={6}
            formatValue={(v) => formatMonths(v)}
          />
          <RangeSlider
            label="New rate"
            value={newRate}
            onChange={setNewRate}
            min={0}
            max={15}
            step={0.125}
            formatValue={(v) => formatPercent(v)}
          />
          <RangeSlider
            label="New term"
            value={newTermMonths}
            onChange={setNewTermMonths}
            min={60}
            max={420}
            step={12}
            formatValue={(v) => formatMonths(v)}
          />
          <NumberInput
            label="Closing costs"
            value={closingCosts}
            onChange={setClosingCosts}
            min={0}
            step={100}
            prefix="$"
          />
        </>
      }
      results={
        <>
          <ResultRow
            label="Monthly savings"
            value={formatCurrency(result.monthlySavings)}
            emphasis
          />
          <ResultRow
            label="Current payment"
            value={formatCurrency(result.currentMonthlyPayment)}
          />
          <ResultRow label="New payment" value={formatCurrency(result.newMonthlyPayment)} />
          <ResultRow
            label="Lifetime interest savings"
            value={formatCurrency(result.interestSavings)}
          />
          <ResultRow
            label="Break-even"
            value={
              result.breakEvenMonths === null
                ? '—'
                : formatMonths(result.breakEvenMonths)
            }
          />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Mode: Bi-weekly
// ---------------------------------------------------------------------------

const BiWeekly: React.FC<{ title: string }> = ({ title }) => {
  const [principal, setPrincipal] = useState(250000);
  const [rate, setRate] = useState(6.25);
  const [termMonths, setTermMonths] = useState(360);

  const dPrincipal = useDebouncedValue(principal);
  const dRate = useDebouncedValue(rate);
  const dTerm = useDebouncedValue(termMonths);

  const result = useMemo(
    () =>
      compareBiWeekly({
        principal: dPrincipal,
        annualRatePercent: dRate,
        termMonths: dTerm,
      }),
    [dPrincipal, dRate, dTerm],
  );

  const monthlySummary = useMemo(
    () => buildAmortizationSchedule(dPrincipal, dRate, dTerm),
    [dPrincipal, dRate, dTerm],
  );
  const series = useMemo(
    () => buildAmortizationYearlySeries(monthlySummary),
    [monthlySummary],
  );

  return (
    <CalculatorLayout
      title={title}
      description="See how splitting your mortgage payment in half every two weeks accelerates payoff."
      footer={
        <ChartSection title="Monthly schedule: principal vs. interest">
          <PrincipalInterestChart data={series} />
        </ChartSection>
      }
      inputs={
        <>
          <NumberInput
            label="Loan amount"
            value={principal}
            onChange={setPrincipal}
            min={0}
            step={1000}
            prefix="$"
          />
          <RangeSlider
            label="Interest rate"
            value={rate}
            onChange={setRate}
            min={0}
            max={15}
            step={0.125}
            formatValue={(v) => formatPercent(v)}
          />
          <RangeSlider
            label="Term"
            value={termMonths}
            onChange={setTermMonths}
            min={60}
            max={420}
            step={12}
            formatValue={(v) => formatMonths(v)}
          />
        </>
      }
      results={
        <>
          <ResultRow
            label="Bi-weekly payment"
            value={formatCurrency(result.biWeeklyPayment)}
            emphasis
          />
          <ResultRow label="Monthly payment" value={formatCurrency(result.monthlyPayment)} />
          <ResultRow label="Interest saved" value={formatCurrency(result.interestSaved)} />
          <ResultRow label="Time saved" value={formatMonths(result.monthsSaved)} />
          <ResultRow
            label="New payoff time"
            value={formatMonths(result.biWeeklyPayoffMonths)}
          />
        </>
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const AmortizationEngine: React.FC<AmortizationEngineProps> = ({ title, mode }) => {
  switch (mode) {
    case 'how-much-loan-can-i-afford':
      return <Affordability title={title} />;
    case 'home-refinance':
      return <Refinance title={title} />;
    case 'bi-weekly-mortgage':
      return <BiWeekly title={title} />;
    case 'loan-payment':
    default:
      return <LoanPayment title={title} />;
  }
};

export default AmortizationEngine;
