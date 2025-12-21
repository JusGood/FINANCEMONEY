
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, initialData, onCancel }) => {
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
    note: '',
    projectName: '',
    clientName: '',
    isForecast: false,
    method: 'Standard' as OperationMethod
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
        note: initialData.note || '',
        projectName: initialData.projectName || '',
        clientName: initialData.clientName || '',
        isForecast: !!initialData.isForecast,
        method: initialData.method || 'Standard'
      });
    }
  }, [initialData]);

  // Calcul auto pour Commande Client (Basé sur prix produit)
  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER && formData.productPrice) {
      const price = parseFloat(formData.productPrice);
      const percent = parseFloat(formData.feePercentage);
      if (!isNaN(price) && !isNaN(percent)) {
        setFormData(prev => ({ ...prev, expectedProfit: ((price * percent) / 100).toFixed(2) }));
      }
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

  // LOGIQUE MULTIPLICATEUR (ex: x0.6)
  const handleProfitChange = (val: string) => {
    // Si l'utilisateur tape "x0.6" ou "*0.6"
    if ((val.startsWith('x') || val.startsWith('*')) && val.length > 1) {
      const multiplier = parseFloat(val.substring(1).replace(',', '.'));
      const baseAmount = parseFloat(formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount);
      
      if (!isNaN(multiplier) && !isNaN(baseAmount)) {
        const result = (baseAmount * multiplier).toFixed(2);
        setFormData({ ...formData, expectedProfit: result });
        return;
      }
    }
    setFormData({ ...formData, expectedProfit: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
    const transactionData = {
      amount: isClientOrder ? 0 : Math.abs(parseFloat(formData.amount || '0')),
      productPrice: isClientOrder ? parseFloat(formData.productPrice) : undefined,
      feePercentage: isClientOrder ? parseFloat(formData.feePercentage) : undefined,
      expectedProfit: Math.abs(parseFloat(formData.expectedProfit || '0')),
      date: formData.date,
      category: formData.category,
      type: formData.type,
      account: formData.account,
      owner: formData.owner,
      note: formData.note,
      projectName: formData.projectName.trim() || undefined,
      clientName: formData.clientName.trim() || undefined,
      isForecast: formData.isForecast,
      isSold: initialData ? initialData.isSold : false,
      method: formData.method
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase hover:text-slate-900 transition-colors">← Retour</button>
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            {initialData ? 'Edition Flux' : 'Nouvelle Opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-3 rounded-lg font-black text-[9px] uppercase transition-all ${formData.owner === o ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs border-none outline-none focus:ring-1 focus:ring-indigo-500">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip</option>
                <option value={TransactionType.INCOME}>Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>Dépense</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs border-none outline-none" />
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-[0.3em]">
              {formData.type === TransactionType.CLIENT_ORDER ? 'PRIX DE VENTE' : 'MONTANT ACHAT'}
            </p>
            <input
              type="number" required step="0.01" 
              value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
              onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
              className="w-full bg-transparent text-center text-5xl font-black text-slate-900 dark:text-white outline-none tabular-nums"
              placeholder="0.00"
            />
          </div>

          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">
                  Profit Net Estimé <span className="text-[7px] opacity-40 ml-1">(Tape x0.6 pour 60%)</span>
                </label>
                <input 
                  type="text" 
                  value={formData.expectedProfit} 
                  onChange={(e) => handleProfitChange(e.target.value)} 
                  className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-sm outline-none border border-emerald-100 dark:border-emerald-900/30" 
                  placeholder="Montant ou x0.xx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Méthode</label>
                <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs outline-none border-none">
                  <option value="Standard">Standard</option>
                  <option value="FTID">FTID</option>
                  <option value="DNA">DNA</option>
                  <option value="EB">EB</option>
                  <option value="LIT">LIT</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none border-none placeholder:text-slate-300" placeholder="Nom de l'article / mission..." />
            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-5 rounded-xl text-[10px] uppercase tracking-[0.3em] shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none hover:-translate-y-0.5 transition-all">
              {initialData ? 'METTRE À JOUR' : 'VALIDER LE FLUX'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
