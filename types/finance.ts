export type FundId = 'emergency' | 'tech' | 'investment';

export type Fractions = { d1: number; d2: number; d3: number };

export type FundBalances = Record<FundId, number>;

export type Goal = {
  id: string;
  label: string;
  targetAmount: number;
  sourceFund: 'tech' | 'investment';
  purchased: boolean;
  purchaseDate?: string;
  icon: string;
  color: string;
  note?: string;
};

export type MonthSnapshot = {
  month: number;
  date: string;
  balances: FundBalances;
  totalWealth: number;
};

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'purchase'
  | 'salary';

export type Transaction = {
  id: string;
  date: string;
  note: string;
  amount: number;
  type: TransactionType;
  fund: FundId;
  tags?: string[];
};

export type InvestmentEntryType = 'sip' | 'lump_sum' | 'withdrawal';

export type InvestmentEntry = {
  id: string;
  date: string;
  provider: string;
  type: InvestmentEntryType;
  amount: number;
  notes?: string;
};

