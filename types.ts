
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

export type OperationMethod = 'FTID' | 'DNA' | 'EB' | 'LIT' | 'Standard';

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
  method?: OperationMethod;
}

export interface Note {
  id: string;
  created_at?: string;
  text: string;
  deadline: string; 
  isCompleted: boolean;
  owner: Owner;
  priority: 'Basse' | 'Haute' | 'Urgent';
}

export const CATEGORIES = [
  'Vente Directe',
  'Flip Stock',
  'Service',
  'FTID',
  'DNA',
  'EB',
  'LIT',
  'Dépense Courante',
  'Solde Initial'
];
