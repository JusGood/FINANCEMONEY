

export enum Owner {
  LARBI = 'Larbi',
  YASSINE = 'Yassine',
  GLOBAL = 'Global',
  // Added CRYPTO to resolve property 'CRYPTO' does not exist error in Layout.tsx
  CRYPTO = 'Crypto'
}

export enum AccountType {
  BANK = 'Banque',
  CRYPTO = 'Crypto',
  CASH = 'Espèces'
}

export enum TransactionType {
  EXPENSE = 'Dépense',      
  INCOME = 'Revenu',        
  INVESTMENT = 'Achat Stock (Flip)', 
  CLIENT_ORDER = 'Commande Client (Commission)',
  INITIAL_BALANCE = 'Solde Initial',
  TRANSFER = 'Virement Interne'
}

export type OperationMethod = 'FTID' | 'DNA' | 'EB' | 'LIT' | 'Standard';

export interface Transaction {
  id: string;
  date: string;
  amount: number; // Montant décaissé (0 pour commande client)
  productPrice?: number; // Valeur de la commande client
  feePercentage?: number; // % de commission (ex: 10%)
  expectedProfit: number; // Profit net attendu
  category: string;
  type: TransactionType;
  account: AccountType;
  owner: Owner;
  toOwner?: Owner; 
  note: string;
  projectName?: string; 
  clientName?: string;
  isSold?: boolean; 
  // Added isForecast to resolve property 'isForecast' does not exist error in Charts.tsx
  isForecast?: boolean;
  method?: OperationMethod;
  assetSymbol?: string;
  assetQuantity?: number;
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
  'Vente Directe', 'Flip Stock', 'Service', 'FTID', 'DNA', 'EB', 'LIT',
  'Dépense Courante', 'Solde Initial', 'Transfert', 'Crypto'
];
