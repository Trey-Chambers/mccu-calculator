import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AmortizationEngine, type AmortizationMode } from './components/AmortizationEngine';
import {
  CompoundInterestEngine,
  type CompoundMode,
} from './components/CompoundInterestEngine';

type CalculatorType = AmortizationMode | CompoundMode;

interface CalculatorRouterProps {
  type: string;
}

const TITLES: Record<CalculatorType, string> = {
  'loan-payment': 'Calculate Your Loan Payment',
  'how-much-loan-can-i-afford': 'How Much Loan Can I Afford?',
  'home-refinance': 'Home Refinance Savings',
  'bi-weekly-mortgage': 'Bi-Weekly Mortgage Payment',
  'build-savings': 'Build Your Savings',
  'future-value-interest': 'Future Value Interest',
};

const AMORTIZATION_MODES: readonly AmortizationMode[] = [
  'loan-payment',
  'how-much-loan-can-i-afford',
  'home-refinance',
  'bi-weekly-mortgage',
];

const COMPOUND_MODES: readonly CompoundMode[] = [
  'build-savings',
  'future-value-interest',
];

const CalculatorRouter: React.FC<CalculatorRouterProps> = ({ type }) => {
  if ((AMORTIZATION_MODES as readonly string[]).includes(type)) {
    const mode = type as AmortizationMode;
    return <AmortizationEngine title={TITLES[mode]} mode={mode} />;
  }

  if ((COMPOUND_MODES as readonly string[]).includes(type)) {
    const mode = type as CompoundMode;
    return <CompoundInterestEngine title={TITLES[mode]} mode={mode} />;
  }

  return (
    <div className="text-red-600" style={{ margin: 0 }}>
      Error: Calculator type "{type}" not found.
    </div>
  );
};

// Find all calculator mount points on the page.
const containers = document.querySelectorAll('.mccu-react-calculator-container');

containers.forEach((container) => {
  const type = container.getAttribute('data-calculator-type') || 'loan-payment';
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <CalculatorRouter type={type} />
    </React.StrictMode>,
  );
});
