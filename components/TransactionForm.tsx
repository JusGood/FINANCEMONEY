
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CRYPTO_ASSETS = ['BTC', 'ETH', 'LTC', 'SOL', 'USDT', 'XRP', 'DOGE'];

const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, onDelete, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '0',
    productPrice: '',
    feePercentage: '10',
    expectedProfit: '',
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    type: TransactionType.CLIENT_ORDER,
    account: AccountType.BANK,
    owner: Owner.LARBI,
    toOwner: Owner.YASSINE,
    note: '',
    projectName: '',
    clientName: '',
    isForecast: false,
    isSold: true, 
    method: 'Standard' as OperationMethod,
    assetSymbol: 'LTC',
    assetQuantity: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        productPrice: initialData.productPrice?.toString() || '',
        feePercentage: initialData.feePercentage?.toString() || '10',
        expectedProfit: initialData.expectedProfit?.toString() || '',
        date: initialData.date,
        category: initialData.category,
        type: initialData.type,
        account: initialData.account,
        owner: initialData.owner,
        toOwner: initialData.toOwner || (initialData.owner === Owner.LARBI ? Owner.YASSINE : Owner.LARBI),
        note: initialData.note || '',
        projectName: initialData.projectName || '',
        clientName: initialData.clientName || '',
        isForecast: !!initialData.isForecast,
        isSold: initialData.isSold !== undefined ? initialData.isSold : true,
        method: initialData.method || 'Standard',
        assetSymbol: initialData.assetSymbol || 'LTC',
        assetQuantity: initialData.assetQuantity?.toString() || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
    const isIncome = formData.type === TransactionType.INCOME;
    const isTransfer = formData.type === TransactionType.TRANSFER;
    const isCrypto = formData.account === AccountType.CRYPTO;
    let finalProfit = formData.expectedProfit.toString().replace(/[x*]/g, '').replace(',', '.');
    
    const transactionData: Omit<Transaction, 'id'> = {
      amount: isClientOrder ? 0 : Math.abs(parseFloat(formData.amount || '0')),
      productPrice: isClientOrder ? parseFloat(formData.productPrice) : undefined,
      feePercentage: isClientOrder ? parseFloat(formData.feePercentage) : undefined,
      expectedProfit: (isIncome || isTransfer) ? 0 : Math.abs(parseFloat(finalProfit || '0')),
      date: formData.date,
      category: isTransfer ? 'Transfert Interne' : formData.category,
      type: formData.type,
      account: formData.account,
      owner: formData.owner,
      toOwner: isTransfer ? formData.toOwner : undefined,
      note: formData.note,
      projectName: formData.projectName.trim() || undefined,
      clientName: formData.clientName.trim() || undefined,
      isForecast: formData.isForecast,
      isSold: (formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) ? formData.isSold : formData.isSold,
      method: formData.method,
      assetSymbol: isCrypto ? formData.assetSymbol : undefined,
      assetQuantity: isCrypto ? parseFloat(formData.assetQuantity) : undefined
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        <div className="flex items-center justify-between mb-10">
           <button onClick={onCancel} type="button" className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase hover:text-slate-900 transition-colors tracking-widest">← Annuler</button>
           <h3 className="text-base font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white italic">
            {initialData ? 'Configuration Flux' : 'Nouvelle Entrée Vault'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.owner === o ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
                {formData.type === TransactionType.TRANSFER ? `De ${o}` : o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">Type de Compte</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={AccountType.BANK}>🏦 Compte Bancaire</option>
                <option value={AccountType.CRYPTO}>🪙 Portefeuille Crypto</option>
                <option value={AccountType.CASH}>💵 Espèces / Physique</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">Activité</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={TransactionType.CLIENT_ORDER}>Commission Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip / Stock</option>
                <option value={TransactionType.INCOME}>Revenu Direct / Salaire</option>
                <option value={TransactionType.EXPENSE}>Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>Transfert Interne</option>
              </select>
            </div>
          </div>

          {formData.account === AccountType.CRYPTO && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-indigo-400 ml-4">Actif Crypto</label>
                <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none">
                  {CRYPTO_ASSETS.map(asset => <option key={asset} value={asset}>{asset}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-indigo-400 ml-4">Quantité (ex: 1.7)</label>
                <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none" placeholder="0.000000" />
              </div>
            </div>
          )}

          <div className="p-12 bg-slate-950 rounded-[2.5rem] border border-white/5 text-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors"></div>
            <p className="relative z-10 text-[11px] font-black uppercase text-indigo-400 mb-4 tracking-[0.5em]">
              {formData.account === AccountType.CRYPTO ? 'VALEUR ESTIMÉE EN EUROS (FIAT)' : 'MONTANT DE L\'OPÉRATION'}
            </p>
            <div className="relative z-10 flex items-center justify-center gap-4">
               <input
                type="number" required step="0.01" 
                value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
                onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
                className="w-full bg-transparent text-center text-7xl font-black text-white outline-none tabular-nums tracking-tighter"
                placeholder="0.00"
              />
              <span className="text-4xl font-black text-white/20 italic">€</span>
            </div>
          </div>

          <div className="space-y-6 pt-6">
            <div className="space-y-2">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Intitulé / Libellé</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm uppercase outline-none border-none placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nom du produit, virement..." />
            </div>
            
            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-7 rounded-[2rem] text-[13px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-500 hover:-translate-y-1 transition-all active:scale-95">
              {initialData ? 'Mettre à jour' : 'Enregistrer le flux'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
