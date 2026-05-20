import { create } from 'zustand';

import { colors } from '@/constants/theme';
import {
  FundBalances,
  FundId,
  Fractions,
  Goal,
  MonthSnapshot,
  Transaction,
  TransactionType,
} from '@/types/finance';

const DEFAULT_SALARY = 130_000;
const DEFAULT_FRACTIONS: Fractions = { d1: 0.30, d2: 0.42, d3: 0.61 };
const DEFAULT_EMERGENCY_TARGET = 240_000;

const SUGGESTED_GOALS: Goal[] = [
  {
    id: 'iphone-17',
    label: 'iPhone 17',
    targetAmount: 375_000,
    sourceFund: 'tech',
    purchased: false,
    icon: 'phone-portrait-outline',
    color: colors.fund.tech,
    note: 'Buy locally — PTA included',
  },
  {
    id: 'macbook-air-m4',
    label: 'MacBook Air M4',
    targetAmount: 350_000,
    sourceFund: 'tech',
    purchased: false,
    icon: 'laptop-outline',
    color: colors.fund.tech,
    note: 'MC6V4 · 24GB · 512GB',
  },
];

const ZERO_BALANCES: FundBalances = { emergency: 0, tech: 0, investment: 0 };

type State = {
  salary: number;
  fractions: Fractions;
  emergencyTarget: number;
  goals: Goal[];
  fundBalances: FundBalances;
  monthsLogged: number;
  snapshots: MonthSnapshot[];
  transactions: Transaction[];
};

type Actions = {
  setSalaryAndFractions: (salary: number, fractions: Fractions) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'purchased'>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  markGoalPurchased: (id: string, actualAmount?: number, note?: string) => void;
  logMonth: () => void;
  addTransaction: (input: AddTransactionInput) => void;
  removeTransaction: (id: string) => void;
};

export type AddTransactionInput = {
  type: Extract<TransactionType, 'income' | 'expense'>;
  fund: FundId;
  amount: number;
  note: string;
  date?: string;
};

export type MonthlyAllocation = {
  expenses: number;
  emergency: number;
  investment: number;
  tech: number;
};

export function computeAllocation(
  salary: number,
  fractions: Fractions
): MonthlyAllocation {
  return {
    expenses: Math.round(salary * fractions.d1),
    emergency: Math.round(salary * (fractions.d2 - fractions.d1)),
    investment: Math.round(salary * (fractions.d3 - fractions.d2)),
    tech: Math.round(salary * (1 - fractions.d3)),
  };
}

// Apply emergency-fund-redirect rule: once emergency >= target, the emergency
// allocation flows into investment instead.
export function nextBalances(
  current: FundBalances,
  alloc: MonthlyAllocation,
  emergencyTarget: number
): FundBalances {
  const efComplete = current.emergency >= emergencyTarget;
  return {
    emergency: efComplete
      ? current.emergency
      : Math.min(emergencyTarget, current.emergency + alloc.emergency),
    tech: current.tech + alloc.tech,
    investment:
      current.investment +
      (efComplete ? alloc.investment + alloc.emergency : alloc.investment),
  };
}

export function totalWealth(b: FundBalances): number {
  return b.emergency + b.tech + b.investment;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useFinanceStore = create<State & Actions>((set, get) => ({
  salary: DEFAULT_SALARY,
  fractions: DEFAULT_FRACTIONS,
  emergencyTarget: DEFAULT_EMERGENCY_TARGET,
  goals: SUGGESTED_GOALS,
  fundBalances: ZERO_BALANCES,
  monthsLogged: 0,
  snapshots: [],
  transactions: [],

  setSalaryAndFractions: (salary, fractions) => set({ salary, fractions }),

  addGoal: (goal) =>
    set((s) => ({
      goals: [
        ...s.goals,
        {
          ...goal,
          id: makeId('goal'),
          purchased: false,
        },
      ],
    })),

  updateGoal: (id, patch) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })),

  removeGoal: (id) =>
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

  markGoalPurchased: (id, actualAmount, note) =>
    set((s) => {
      const goal = s.goals.find((g) => g.id === id);
      if (!goal || goal.purchased) return s;
      const amt = actualAmount ?? goal.targetAmount;
      const fundKey = goal.sourceFund;
      const newBalances = { ...s.fundBalances };
      newBalances[fundKey] = Math.max(0, newBalances[fundKey] - amt);
      const tx: Transaction = {
        id: makeId('tx'),
        date: new Date().toISOString(),
        note: note?.trim()
          ? `Purchased ${goal.label} — ${note.trim()}`
          : `Purchased ${goal.label}`,
        amount: amt,
        type: 'purchase',
        fund: fundKey,
      };
      return {
        goals: s.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                purchased: true,
                purchaseDate: new Date().toISOString(),
                note: note ?? g.note,
              }
            : g
        ),
        fundBalances: newBalances,
        transactions: [tx, ...s.transactions],
      };
    }),

  logMonth: () => {
    const s = get();
    if (s.salary <= 0) return;
    const alloc = computeAllocation(s.salary, s.fractions);
    const before = s.fundBalances;
    const next = nextBalances(before, alloc, s.emergencyTarget);
    const month = s.monthsLogged + 1;
    const snapshot: MonthSnapshot = {
      month,
      date: new Date().toISOString(),
      balances: next,
      totalWealth: totalWealth(next),
    };
    const date = new Date().toISOString();
    const delta: Record<FundId, number> = {
      emergency: next.emergency - before.emergency,
      tech: next.tech - before.tech,
      investment: next.investment - before.investment,
    };
    const newTxs: Transaction[] = (
      ['emergency', 'investment', 'tech'] as FundId[]
    )
      .filter((f) => delta[f] > 0)
      .map((f) => ({
        id: makeId('tx'),
        date,
        note: `Month ${month} salary distribution`,
        amount: delta[f],
        type: 'salary',
        fund: f,
      }));
    set({
      fundBalances: next,
      monthsLogged: month,
      snapshots: [...s.snapshots, snapshot],
      transactions: [...newTxs, ...s.transactions],
    });
  },

  addTransaction: (input) =>
    set((s) => {
      if (input.amount <= 0) return s;
      const newBalances = { ...s.fundBalances };
      if (input.type === 'income') {
        newBalances[input.fund] = newBalances[input.fund] + input.amount;
      } else {
        newBalances[input.fund] = Math.max(
          0,
          newBalances[input.fund] - input.amount
        );
      }
      const tx: Transaction = {
        id: makeId('tx'),
        date: input.date ?? new Date().toISOString(),
        note: input.note.trim() || (input.type === 'income' ? 'Income' : 'Expense'),
        amount: input.amount,
        type: input.type,
        fund: input.fund,
      };
      return {
        fundBalances: newBalances,
        transactions: [tx, ...s.transactions],
      };
    }),

  removeTransaction: (id) =>
    set((s) => {
      const tx = s.transactions.find((t) => t.id === id);
      if (!tx) return s;
      // Reverse the balance change. Salary/income added; expense/purchase subtracted.
      const newBalances = { ...s.fundBalances };
      if (tx.type === 'income' || tx.type === 'salary') {
        newBalances[tx.fund] = Math.max(0, newBalances[tx.fund] - tx.amount);
      } else if (tx.type === 'expense' || tx.type === 'purchase') {
        newBalances[tx.fund] = newBalances[tx.fund] + tx.amount;
      }
      return {
        fundBalances: newBalances,
        transactions: s.transactions.filter((t) => t.id !== id),
      };
    }),
}));

export function monthlyTechAllocation(salary: number, fractions: Fractions): number {
  return Math.round(salary * (1 - fractions.d3));
}

export function monthlyInvestmentAllocation(salary: number, fractions: Fractions): number {
  return Math.round(salary * (fractions.d3 - fractions.d2));
}

export function monthsToGoal(targetAmount: number, monthlyAlloc: number): number | null {
  if (monthlyAlloc <= 0) return null;
  return Math.ceil(targetAmount / monthlyAlloc);
}
