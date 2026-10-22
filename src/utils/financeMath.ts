/**
 * MCCU financial math utilities.
 *
 * Pure, framework-free functions. All monetary results are rounded to cents so
 * the UI can render stable values. Every helper is defensive against the usual
 * degenerate inputs — 0% rate, 0-length term, negative numbers, non-finite
 * values — and will return a sensible zeroed-out result instead of NaN/Infinity.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AmortizationSummary {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortizationRow[];
}

export interface RefinanceInput {
  currentBalance: number;
  currentRate: number;        // annual %, e.g. 6.5
  remainingMonths: number;
  newRate: number;            // annual %
  newTermMonths: number;
  closingCosts?: number;
}

export interface RefinanceResult {
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySavings: number;
  currentTotalInterest: number;
  newTotalInterest: number;
  interestSavings: number;
  breakEvenMonths: number | null; // null when there is no monthly savings
}

export interface BiWeeklyInput {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
}

export interface BiWeeklyResult {
  monthlyPayment: number;
  biWeeklyPayment: number;
  monthlyTotalInterest: number;
  biWeeklyTotalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  biWeeklyPayoffMonths: number;
}

export type ContributionFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annually';

export interface CompoundInput {
  principal: number;
  annualRatePercent: number;
  years: number;
  compoundsPerYear?: number; // default 12
}

export interface CompoundContributionInput extends CompoundInput {
  contribution: number;
  contributionFrequency?: ContributionFrequency; // default 'monthly'
}

export interface CompoundSummary {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
}

// Chart series rows
export interface AmortizationYearPoint {
  year: number;
  principalPaid: number;   // cumulative
  interestPaid: number;    // cumulative
  balance: number;         // end-of-year balance
}

export interface CompoundYearPoint {
  year: number;
  contributions: number; // cumulative contributions (incl. starting principal)
  interest: number;      // cumulative interest
  balance: number;       // ending balance
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const toCents = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
};

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const safeNumber = (value: number): number =>
  Number.isFinite(value) ? value : 0;

const frequencyPerYear = (frequency: ContributionFrequency): number => {
  switch (frequency) {
    case 'weekly':
      return 52;
    case 'biweekly':
      return 26;
    case 'annually':
      return 1;
    case 'monthly':
    default:
      return 12;
  }
};

// ---------------------------------------------------------------------------
// Amortization
// ---------------------------------------------------------------------------

/** Convert an annual percentage rate (e.g. 6.5) into a monthly decimal rate. */
export const monthlyRate = (annualRatePercent: number): number => {
  if (!Number.isFinite(annualRatePercent)) return 0;
  return annualRatePercent / 100 / 12;
};

/** Standard amortizing loan payment (PMT). */
export const calculatePayment = (
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number => {
  if (!isPositiveFinite(principal) || !isPositiveFinite(termMonths)) return 0;

  const r = monthlyRate(annualRatePercent);
  if (r <= 0) {
    return toCents(principal / termMonths);
  }

  const factor = Math.pow(1 + r, termMonths);
  const payment = (principal * r * factor) / (factor - 1);
  return toCents(safeNumber(payment));
};

/** Inverse PMT — the largest principal supportable by a given payment. */
export const calculatePrincipal = (
  payment: number,
  annualRatePercent: number,
  termMonths: number,
): number => {
  if (!isPositiveFinite(payment) || !isPositiveFinite(termMonths)) return 0;

  const r = monthlyRate(annualRatePercent);
  if (r <= 0) {
    return toCents(payment * termMonths);
  }

  const factor = Math.pow(1 + r, termMonths);
  const principal = (payment * (factor - 1)) / (r * factor);
  return toCents(safeNumber(principal));
};

/**
 * Build a full month-by-month amortization schedule plus summary totals.
 * Returns an empty schedule and zeroed summary for degenerate inputs.
 */
export const buildAmortizationSchedule = (
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): AmortizationSummary => {
  const empty: AmortizationSummary = {
    monthlyPayment: 0,
    totalInterest: 0,
    totalPaid: 0,
    schedule: [],
  };

  if (!isPositiveFinite(principal) || !isPositiveFinite(termMonths)) return empty;

  const payment = calculatePayment(principal, annualRatePercent, termMonths);
  if (payment <= 0) return empty;

  const r = monthlyRate(annualRatePercent);
  const schedule: AmortizationRow[] = [];

  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;

  for (let period = 1; period <= termMonths; period += 1) {
    const interest = Math.max(0, balance * r);
    let principalPortion = payment - interest;

    // Final payment: absorb rounding so balance lands at exactly 0.
    if (period === termMonths || principalPortion > balance) {
      principalPortion = balance;
    }

    const rowPayment = toCents(principalPortion + interest);
    balance = Math.max(0, balance - principalPortion);

    const row: AmortizationRow = {
      period,
      payment: rowPayment,
      principal: toCents(principalPortion),
      interest: toCents(interest),
      balance: toCents(balance),
    };

    schedule.push(row);
    totalInterest += row.interest;
    totalPaid += row.payment;

    if (balance <= 0) break;
  }

  return {
    monthlyPayment: payment,
    totalInterest: toCents(totalInterest),
    totalPaid: toCents(totalPaid),
    schedule,
  };
};

/**
 * Compare the user's current loan against a proposed refinance.
 */
export const compareRefinance = (input: RefinanceInput): RefinanceResult => {
  const {
    currentBalance,
    currentRate,
    remainingMonths,
    newRate,
    newTermMonths,
    closingCosts = 0,
  } = input;

  const current = buildAmortizationSchedule(currentBalance, currentRate, remainingMonths);
  const next = buildAmortizationSchedule(currentBalance, newRate, newTermMonths);

  const monthlySavings = toCents(current.monthlyPayment - next.monthlyPayment);
  const interestSavings = toCents(
    current.totalInterest - next.totalInterest - safeNumber(closingCosts),
  );

  const breakEvenMonths =
    monthlySavings > 0
      ? Math.ceil(safeNumber(closingCosts) / monthlySavings)
      : null;

  return {
    currentMonthlyPayment: current.monthlyPayment,
    newMonthlyPayment: next.monthlyPayment,
    monthlySavings,
    currentTotalInterest: current.totalInterest,
    newTotalInterest: next.totalInterest,
    interestSavings,
    breakEvenMonths,
  };
};

/**
 * Compare a standard monthly amortization schedule to a bi-weekly schedule
 * (half the monthly payment, applied every two weeks ~ 26 times a year).
 */
export const compareBiWeekly = (input: BiWeeklyInput): BiWeeklyResult => {
  const { principal, annualRatePercent, termMonths } = input;

  const empty: BiWeeklyResult = {
    monthlyPayment: 0,
    biWeeklyPayment: 0,
    monthlyTotalInterest: 0,
    biWeeklyTotalInterest: 0,
    interestSaved: 0,
    monthsSaved: 0,
    biWeeklyPayoffMonths: 0,
  };

  if (!isPositiveFinite(principal) || !isPositiveFinite(termMonths)) return empty;

  const monthly = buildAmortizationSchedule(principal, annualRatePercent, termMonths);
  if (monthly.monthlyPayment <= 0) return empty;

  const biWeeklyPayment = toCents(monthly.monthlyPayment / 2);
  const biWeeklyRate = safeNumber(annualRatePercent) / 100 / 26;

  // Simulate 26 bi-weekly periods per year; cap at 60 years to avoid runaway loops.
  const maxPeriods = Math.ceil((termMonths / 12) * 26) + 26 * 60;
  let balance = principal;
  let totalInterest = 0;
  let periods = 0;

  for (let i = 1; i <= maxPeriods; i += 1) {
    const interest = Math.max(0, balance * biWeeklyRate);
    let principalPortion = biWeeklyPayment - interest;

    if (principalPortion <= 0) {
      // Payment can't cover interest — loan won't amortize. Bail out.
      return {
        ...empty,
        monthlyPayment: monthly.monthlyPayment,
        biWeeklyPayment,
        monthlyTotalInterest: monthly.totalInterest,
      };
    }

    if (principalPortion > balance) principalPortion = balance;

    balance = Math.max(0, balance - principalPortion);
    totalInterest += interest;
    periods = i;

    if (balance <= 0) break;
  }

  const biWeeklyPayoffMonths = Math.round((periods / 26) * 12);
  const monthsSaved = Math.max(0, termMonths - biWeeklyPayoffMonths);

  return {
    monthlyPayment: monthly.monthlyPayment,
    biWeeklyPayment,
    monthlyTotalInterest: monthly.totalInterest,
    biWeeklyTotalInterest: toCents(totalInterest),
    interestSaved: toCents(monthly.totalInterest - totalInterest),
    monthsSaved,
    biWeeklyPayoffMonths,
  };
};

// ---------------------------------------------------------------------------
// Compound interest
// ---------------------------------------------------------------------------

/** Future value of a lump sum compounded `compoundsPerYear` times a year. */
export const futureValueLumpSum = (
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundsPerYear: number = 12,
): CompoundSummary => {
  const empty: CompoundSummary = {
    futureValue: 0,
    totalContributions: 0,
    totalInterest: 0,
  };

  if (!isPositiveFinite(principal) || !isPositiveFinite(years)) return empty;

  const n = isPositiveFinite(compoundsPerYear) ? compoundsPerYear : 12;
  const rate = safeNumber(annualRatePercent) / 100;

  let futureValue: number;
  if (rate <= 0) {
    futureValue = principal;
  } else {
    futureValue = principal * Math.pow(1 + rate / n, n * years);
  }

  return {
    futureValue: toCents(futureValue),
    totalContributions: toCents(principal),
    totalInterest: toCents(futureValue - principal),
  };
};

/**
 * Future value of an initial principal plus a recurring contribution.
 * Rate is converted into the compounding frequency; the contribution series is
 * treated as an annuity at that same frequency so the two cash flows stay in sync.
 */
export const futureValueWithContributions = (
  input: CompoundContributionInput,
): CompoundSummary => {
  const {
    principal,
    annualRatePercent,
    years,
    compoundsPerYear = 12,
    contribution,
    contributionFrequency = 'monthly',
  } = input;

  const empty: CompoundSummary = {
    futureValue: 0,
    totalContributions: 0,
    totalInterest: 0,
  };

  if (!isPositiveFinite(years)) return empty;
  if (!Number.isFinite(principal) || principal < 0) return empty;
  if (!Number.isFinite(contribution) || contribution < 0) return empty;

  const n = isPositiveFinite(compoundsPerYear) ? compoundsPerYear : 12;
  const contribPerYear = frequencyPerYear(contributionFrequency);
  // Line the contribution cadence up with the compounding cadence so the
  // annuity formula applies cleanly.
  const effectivePeriodsPerYear = Math.max(n, contribPerYear);
  const periodicContribution =
    (contribution * contribPerYear) / effectivePeriodsPerYear;

  const periods = effectivePeriodsPerYear * years;
  const r = safeNumber(annualRatePercent) / 100 / effectivePeriodsPerYear;

  let futureValue: number;
  if (r <= 0) {
    futureValue = principal + periodicContribution * periods;
  } else {
    const growth = Math.pow(1 + r, periods);
    const fvPrincipal = principal * growth;
    const fvContrib = periodicContribution * ((growth - 1) / r);
    futureValue = fvPrincipal + fvContrib;
  }

  const totalContributions = principal + contribution * contribPerYear * years;

  return {
    futureValue: toCents(safeNumber(futureValue)),
    totalContributions: toCents(totalContributions),
    totalInterest: toCents(safeNumber(futureValue) - totalContributions),
  };
};

// ---------------------------------------------------------------------------
// Chart series builders (pure)
// ---------------------------------------------------------------------------

/**
 * Collapse an amortization schedule into one data point per year. Returns an
 * empty array for degenerate schedules so chart components can short-circuit.
 */
export const buildAmortizationYearlySeries = (
  summary: AmortizationSummary,
): AmortizationYearPoint[] => {
  if (!summary.schedule.length) return [];

  const points: AmortizationYearPoint[] = [];
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  summary.schedule.forEach((row, index) => {
    cumulativePrincipal += row.principal;
    cumulativeInterest += row.interest;
    const isYearBoundary = (index + 1) % 12 === 0;
    const isLastRow = index === summary.schedule.length - 1;

    if (isYearBoundary || isLastRow) {
      const year = Math.ceil((index + 1) / 12);
      points.push({
        year,
        principalPaid: toCents(cumulativePrincipal),
        interestPaid: toCents(cumulativeInterest),
        balance: row.balance,
      });
    }
  });

  return points;
};

/**
 * Year-by-year growth series for compound interest scenarios. Mirrors the
 * assumptions in futureValueWithContributions so the chart lines up with the
 * summary numbers.
 */
export const buildCompoundYearlySeries = (
  input: CompoundContributionInput,
): CompoundYearPoint[] => {
  const {
    principal,
    annualRatePercent,
    years,
    compoundsPerYear = 12,
    contribution,
    contributionFrequency = 'monthly',
  } = input;

  if (!isPositiveFinite(years)) return [];
  if (!Number.isFinite(principal) || principal < 0) return [];
  if (!Number.isFinite(contribution) || contribution < 0) return [];

  const n = isPositiveFinite(compoundsPerYear) ? compoundsPerYear : 12;
  const contribPerYear = frequencyPerYear(contributionFrequency);
  const effectivePeriodsPerYear = Math.max(n, contribPerYear);
  const periodicContribution =
    (contribution * contribPerYear) / effectivePeriodsPerYear;
  const r = safeNumber(annualRatePercent) / 100 / effectivePeriodsPerYear;

  const points: CompoundYearPoint[] = [];
  let balance = principal;
  let cumulativeContrib = principal;
  const totalYears = Math.ceil(years);

  for (let year = 1; year <= totalYears; year += 1) {
    for (let p = 0; p < effectivePeriodsPerYear; p += 1) {
      balance = balance * (1 + r) + periodicContribution;
      cumulativeContrib += periodicContribution;
    }
    const safeBalance = Math.max(0, safeNumber(balance));
    points.push({
      year,
      contributions: toCents(cumulativeContrib),
      interest: toCents(safeBalance - cumulativeContrib),
      balance: toCents(safeBalance),
    });
  }

  return points;
};
