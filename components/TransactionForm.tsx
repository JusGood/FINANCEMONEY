
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
    toOwner: Owner.YASSINE,
    note: '',
    projectName: '',
    clientName: '',
    isForecast: false,
    isSold: true, 
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
        toOwner: initialData.toOwner || (initialData.owner === Owner.LARBI ? Owner.YASSINE : Owner.LARBI),
        note: initialData.note || '',
        projectName: initialData.projectName || '',
        clientName: initialData.clientName || '',
        isForecast: !!initialData.isForecast,
        isSold: initialData.isSold !== undefined ? initialData.isSold : true,
        method: initialData.method || 'Standard'
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER && formData.productPrice) {
      const clientBenefit = parseFloat(formData.productPrice);
      const percent = parseFloat(formData.feePercentage);
      if (!isNaN(clientBenefit) && !isNaN(percent)) {
        setFormData(prev => ({ ...prev, expectedProfit: ((clientBenefit * percent) / 100).toFixed(2) }));
      }
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

  const handleProfitChange = (val: string) => {
    if (formData.type !== TransactionType.CLIENT_ORDER && val.length > 1 && (val.endsWith('x') || val.endsWith('*'))) {
      const numPart = val.slice(0, -1).replace(',', '.');
      const multiplier = parseFloat(numPart);
      const baseAmount = parseFloat(formData.amount || '0');
      
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
    const isIncome = formData.type === TransactionType.INCOME;
    const isTransfer = formData.type === TransactionType.TRANSFER;
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
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">Activité</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType, isSold: true})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={TransactionType.CLIENT_ORDER}>Commission (Apport d'affaire)</option>
                <option value={TransactionType.INVESTMENT}>Achat Flip (Stock personnel)</option>
                <option value={TransactionType.INCOME}>Revenu Direct / Salaire</option>
                <option value={TransactionType.EXPENSE}>Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>Transfert Interne (Compte à compte)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Date prévue/réelle</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>

          {formData.type === TransactionType.TRANSFER && (
            <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1.5 animate-in slide-in-from-top-2">
               {[Owner.LARBI, Owner.YASSINE].map(o => (
                <button key={o} type="button" disabled={formData.owner === o} onClick={() => setFormData({...formData, toOwner: o})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.toOwner === o ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 disabled:opacity-20'}`}>
                  Vers {o}
                </button>
              ))}
            </div>
          )}

          <div className="p-12 bg-slate-950 rounded-[2.5rem] border border-white/5 text-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors"></div>
            <p className="relative z-10 text-[11px] font-black uppercase text-indigo-400 mb-4 tracking-[0.5em]">
              {formData.type === TransactionType.CLIENT_ORDER ? 'BÉNÉFICE TOTAL DU CLIENT' : 'MONTANT DU MOUVEMENT'}
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

          {formData.type === TransactionType.INCOME && (
             <div className="flex items-center justify-between p-8 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10">
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Disponibilité des fonds</p>
                  <p className="text-xs text-slate-500 font-bold">L'argent est-il déjà sur votre compte ?</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isSold: false})}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.isSold ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                   >
                    Plus tard
                   </button>
                   <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isSold: true})}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isSold ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                   >
                    Déjà reçu
                   </button>
                </div>
             </div>
          )}

          {(formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT) && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-4">
                    {formData.type === TransactionType.CLIENT_ORDER ? 'MA PART (COMMISSION 10%)' : 'PROFIT ESTIMÉ'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.expectedProfit} 
                      onChange={(e) => handleProfitChange(e.target.value)} 
                      className="w-full p-6 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-2xl font-black text-2xl outline-none border border-emerald-500/20 transition-all focus:ring-2 focus:ring-emerald-500 text-center tabular-nums" 
                      placeholder="0.00"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                       <span className="text-emerald-500/40 font-black text-sm uppercase">€ net</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Méthode Utilisée</label>
                  <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm outline-none border-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Standard">Standard</option>
                    <option value="FTID">FTID</option>
                    <option value="DNA">DNA</option>
                    <option value="EB">EB</option>
                    <option value="LIT">LIT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider italic">Statut du dossier</span>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isSold: false})}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${!formData.isSold ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    En attente (Ouvert)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isSold: true})}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${formData.isSold ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Payé (Clos)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-6">
            <div className="space-y-2">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Intitulé / Libellé</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm uppercase outline-none border-none placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nom du produit, salaire, virement..." />
            </div>
            
            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-7 rounded-[2rem] text-[13px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-500 hover:-translate-y-1 transition-all active:scale-95">
              {initialData ? 'Mettre à jour' : 'Enregistrer le flux'}
            </button>
            
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialData.id)}
                className="w-full bg-rose-500/10 text-rose-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all mt-6"
              >
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
