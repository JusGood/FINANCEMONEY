import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner } from '../types';
import { Icons } from '../constants';

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
    isForecast: false
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
        isForecast: !!initialData.isForecast
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
      isSold: initialData ? initialData.isSold : false
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-12 md:px-6">
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl relative">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-[10px] uppercase">← Retour</button>
           <h3 className="text-xl font-black uppercase tracking-tighter">
            {initialData ? 'Modifier' : 'Nouveau Flux'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-xl font-black text-[10px] transition-all ${formData.owner === o ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                {o.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs appearance-none">
                <option value={TransactionType.CLIENT_ORDER}>Commande</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip</option>
                <option value={TransactionType.INCOME}>Revenu</option>
                <option value={TransactionType.EXPENSE}>Dépense</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs" />
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl space-y-2">
            <p className="text-[8px] font-black uppercase text-slate-400 text-center">Montant (€)</p>
            <input
              type="number" required step="0.01" 
              value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
              onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
              className="w-full bg-transparent text-center text-4xl font-black text-indigo-600 outline-none"
              placeholder="0.00"
            />
          </div>

          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Profit estimé</p>
                <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="bg-transparent text-2xl font-black text-emerald-700 outline-none w-32" />
              </div>
              <span className="text-2xl">💎</span>
            </div>
          )}

          <div className="space-y-3">
            <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs" placeholder="Nom du Projet" />
            <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs" placeholder="Note / Client" />
          </div>

          {/* ZONE DANGER SUPPRESSION : Juste avant le bouton de sauvegarde */}
          <div className="pt-4 flex flex-col gap-4">
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialData.id)}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-200"
              >
                !!! SUPPRIMER DÉFINITIVEMENT !!!
              </button>
            )}

            <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl">
              {initialData ? 'Valider les changements' : 'Enregistrer le flux'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;