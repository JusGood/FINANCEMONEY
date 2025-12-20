
export enum Owner {
  LARBI = 'Larbi',
  YASSINE = 'Yassine',
  GLOBAL = 'Global'
}

export enum AccountType {
  BANK = 'Banque',
  CRYPTO = 'Crypto',
  CASH = 'Espèces'
}

export enum TransactionType {
  EXPENSE = 'Dépense',      
  INCOME = 'Revenu',        
  INVESTMENT = 'Achat Stock', 
  CLIENT_ORDER = 'Commande Client',
  INITIAL_BALANCE = 'Solde Initial' 
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  productPrice?: number;
  feePercentage?: number;
  expectedProfit?: number;
  category: string;
  type: TransactionType;
  account: AccountType;
  owner: Owner;
  note: string;
  projectName?: string; 
  clientName?: string;
  isForecast?: boolean;
  isSold?: boolean; 
}

export interface ProjectSummary {
  name: string;
  clientName?: string;
  totalSpent: number;
  totalEarned: number;
  potentialProfit: number;
  totalExpectedReturn: number;
  status: 'active' | 'completed';
  lastActivity: string;
  originalTransactionId?: string;
  type: TransactionType;
}

export const CATEGORIES = [
  'FTID',
  'DNA',
  'EB',
  'LIT',
  'Dépense',
  'Solde Initial'
];
