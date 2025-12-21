
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

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
    note: '',
    projectName: '',
    clientName: '',
    isForecast: false,
    isSold: false,
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
        isSold: !!initialData.isSold,
        method: initialData.method || 'Standard'
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER && formData.productPrice) {
      const price = parseFloat(formData.productPrice);
      const percent = parseFloat(formData.feePercentage);
      if (!isNaN(price) && !isNaN(percent)) {
        setFormData(prev => ({ ...prev, expectedProfit: ((price * percent) / 100).toFixed(2) }));
      }
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

  const handleProfitChange = (val: string) => {
    if (val.length > 1 && (val.endsWith('x') || val.endsWith('*'))) {
      const numPart = val.slice(0, -1).replace(',', '.');
      const multiplier = parseFloat(numPart);
      const baseAmount = parseFloat(
        formData.type === TransactionType.CLIENT_ORDER 
          ? (formData.productPrice || '0') 
          : (formData.amount || '0')
      );
      
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
    let finalProfit = formData.expectedProfit.toString().replace(/[x*]/g, '').replace(',', '.');
    
    const transactionData = {
      amount: isClientOrder ? 0 : Math.abs(parseFloat(formData.amount || '0')),
      productPrice: isClientOrder ? parseFloat(formData.productPrice) : undefined,
      feePercentage: isClientOrder ? parseFloat(formData.feePercentage) : undefined,
      expectedProfit: Math.abs(parseFloat(finalProfit || '0')),
      date: formData.date,
      category: formData.category,
      type: formData.type,
      account: formData.account,
      owner: formData.owner,
      note: formData.note,
      projectName: formData.projectName.trim() || undefined,
      clientName: formData.clientName.trim() || undefined,
      isForecast: formData.isForecast,
      isSold: formData.isSold,
      method: formData.method
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        <div className="flex items-center justify-between mb-10">
           <button onClick={onCancel} type="button" className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase hover:text-slate-900 transition-colors tracking-widest">← Annuler</button>
           <h3 className="text-base font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">
            {initialData ? 'Editer le Flux' : 'Nouvelle Opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.owner === o ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Type d'opération</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip</option>
                <option value={TransactionType.INCOME}>Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>Dépense</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>

          <div className="p-12 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center shadow-inner">
            <p className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.5em]">
              {formData.type === TransactionType.CLIENT_ORDER ? 'PRIX DE VENTE' : 'MONTANT ACHAT'}
            </p>
            <input
              type="number" required step="0.01" 
              value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
              onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
              className="w-full bg-transparent text-center text-6xl font-black text-slate-900 dark:text-white outline-none tabular-nums tracking-tighter"
              placeholder="0.00"
            />
          </div>

          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-4">
                    Profit Estimé <span className="opacity-40 ml-1">(Ex: 0.6x)</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.expectedProfit} 
                    onChange={(e) => handleProfitChange(e.target.value)} 
                    className="w-full p-5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-lg outline-none border border-emerald-100 dark:border-emerald-900/30 transition-all focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Tape 0.6x"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-4">Méthode</label>
                  <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm outline-none border-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Standard">Standard</option>
                    <option value="FTID">FTID</option>
                    <option value="DNA">DNA</option>
                    <option value="EB">EB</option>
                    <option value="LIT">LIT</option>
                  </select>
                </div>
              </div>

              {initialData && (
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">État actuel du flux</span>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isSold: false})}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${!formData.isSold ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Ouvert
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isSold: true})}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${formData.isSold ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Soldé / Clos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6 pt-6">
            <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm uppercase outline-none border-none placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nom de l'article / mission spécifique..." />
            
            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-6 rounded-2xl text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-500 hover:-translate-y-1 transition-all">
              {initialData ? 'Enregistrer les modifications' : 'Confirmer le Flux Financier'}
            </button>
            
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialData.id)}
                className="w-full bg-rose-500/10 text-rose-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all mt-6"
              >
                Supprimer l'opération
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
