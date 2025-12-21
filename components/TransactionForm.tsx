
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';
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
      isSold: initialData ? initialData.isSold : false,
      method: formData.method
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  const methods: OperationMethod[] = ['Standard', 'FTID', 'DNA', 'EB', 'LIT'];

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-12 md:px-6">
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-[10px] uppercase hover:text-slate-900 transition-colors">← Retour</button>
           <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">
            {initialData ? 'Editer l\'Opération' : 'Nouveau Flux'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SÉLECTEUR PROPRIÉTAIRE */}
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${formData.owner === o ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Type d'opération</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xs appearance-none cursor-pointer hover:bg-slate-100 transition-colors border-none outline-none">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client 👤</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip / Stock 📦</option>
                <option value={TransactionType.INCOME}>Revenu Direct 💰</option>
                <option value={TransactionType.EXPENSE}>Dépense 📉</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xs uppercase border-none outline-none" />
            </div>
          </div>

          {/* SÉLECTEUR DE MÉTHODE (FTID, DNA, etc.) */}
          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Méthode de Récupération / Stratégie</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {methods.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({...formData, method: m})}
                    className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
                      formData.method === m 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' 
                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-10 bg-slate-50 rounded-[3rem] space-y-3 border border-slate-100 shadow-inner">
            <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-[0.3em]">
              {formData.type === TransactionType.CLIENT_ORDER ? 'PRIX DE VENTE (€)' : 'MONTANT INVESTI (€)'}
            </p>
            <input
              type="number" required step="0.01" 
              value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
              onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
              className="w-full bg-transparent text-center text-6xl font-black text-slate-900 outline-none tabular-nums"
              placeholder="0.00"
            />
          </div>

          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="bg-emerald-500 p-8 rounded-[3rem] shadow-xl shadow-emerald-100 flex items-center justify-between group transition-all hover:scale-[1.01]">
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Profit Cible Prévu</p>
                <div className="flex items-baseline gap-2">
                   <input 
                     type="number" 
                     step="0.01" 
                     value={formData.expectedProfit} 
                     onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} 
                     className="bg-transparent text-4xl font-black text-white outline-none w-40 tabular-nums" 
                   />
                   <span className="text-white/50 font-black italic">EUR</span>
                </div>
              </div>
              <div className="text-5xl group-hover:rotate-12 transition-transform">💎</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nom de l'Opération</label>
              <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Ex: STOCK IPHONE 15 PRO" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Client ou Référence</label>
              <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Ex: @vendeur_telecom" />
            </div>
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
              {initialData ? 'Enregistrer les Modifications' : 'Lancer l\'Opération Financière'}
            </button>
            
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialData.id)}
                className="w-full bg-white text-rose-500 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-50 transition-all"
              >
                Supprimer de l'Historique
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
