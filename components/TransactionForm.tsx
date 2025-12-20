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
        const calculated = (price * percent) / 100;
        setFormData(prev => ({ ...prev, expectedProfit: calculated.toFixed(2) }));
      }
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
    const finalAmount = isClientOrder ? 0 : Math.abs(parseFloat(formData.amount || '0'));
    const finalProfit = Math.abs(parseFloat(formData.expectedProfit || '0'));

    const transactionData = {
      amount: finalAmount,
      productPrice: isClientOrder ? parseFloat(formData.productPrice) : undefined,
      feePercentage: isClientOrder ? parseFloat(formData.feePercentage) : undefined,
      expectedProfit: finalProfit,
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

    if (initialData && onUpdate) {
      onUpdate(initialData.id, { ...initialData, ...transactionData });
    } else {
      onAdd(transactionData);
    }
  };

  const showProfitSection = formData.type === TransactionType.CLIENT_ORDER || formData.type === TransactionType.INVESTMENT;

  return (
    <div className="max-w-4xl mx-auto py-2 md:py-12 md:px-6 pb-32">
      <div className="bg-white p-5 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 blur-[80px] md:blur-[120px] opacity-20 -mr-20 -mt-20 transition-colors ${formData.owner === Owner.LARBI ? 'bg-indigo-600' : 'bg-purple-600'}`}></div>
        
        <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
           <button onClick={onCancel} className="p-3 bg-slate-50 rounded-xl text-slate-400 font-black text-[9px] md:text-xs uppercase tracking-widest active:scale-95 transition-all">
             ← Annuler
           </button>
           <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            {initialData ? 'Edition' : 'Nouveau'}
          </h3>
          {initialData && onDelete ? (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.id)}
              className="p-3 bg-rose-50 text-rose-500 rounded-xl active:scale-95 transition-all"
            >
              <Icons.Trash />
            </button>
          ) : <div className="w-10"></div>}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10 relative z-10">
          {/* Owner Toggle */}
          <div className="bg-slate-50 p-1.5 rounded-2xl md:rounded-[2rem] flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button
                key={o}
                type="button"
                onClick={() => setFormData({...formData, owner: o})}
                className={`flex-1 py-4 md:py-5 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-sm transition-all ${
                  formData.owner === o 
                  ? (o === Owner.LARBI ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-purple-600 text-white shadow-xl shadow-purple-100')
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {o.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de flux</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full px-5 md:px-8 py-4 md:py-5 bg-slate-50 border-none rounded-xl md:rounded-3xl font-bold text-slate-700 outline-none text-sm appearance-none"
              >
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Stock (Flip)</option>
                <option value={TransactionType.INCOME}>Revenu Entrant</option>
                <option value={TransactionType.EXPENSE}>Dépense / Frais</option>
                <option value={TransactionType.INITIAL_BALANCE}>Solde Initial</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <input
                type="date" value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-5 md:px-8 py-4 md:py-5 bg-slate-50 border-none rounded-xl md:rounded-3xl font-bold text-slate-700 outline-none text-sm"
              />
            </div>
          </div>

          <div className="p-5 md:p-10 bg-slate-50 rounded-2xl md:rounded-[3rem] border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[9px]">Valeur Transaction</h4>
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input 
                  type="checkbox" checked={formData.isForecast}
                  onChange={(e) => setFormData({...formData, isForecast: e.target.checked})}
                  className="w-4 h-4 rounded-md text-indigo-600"
                />
                <span className="text-[9px] font-black text-slate-400 uppercase">Prévision</span>
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-2xl md:text-3xl font-black text-slate-300">€</span>
              <input
                type="number" required step="0.01" value={formData.type === TransactionType.CLIENT_ORDER ? formData.productPrice : formData.amount}
                placeholder="0.00"
                onChange={(e) => setFormData({...formData, [formData.type === TransactionType.CLIENT_ORDER ? 'productPrice' : 'amount']: e.target.value})}
                className="w-full pl-12 md:pl-16 pr-6 md:pr-8 py-6 md:py-10 bg-white border-none rounded-2xl md:rounded-[2.5rem] text-3xl md:text-6xl font-black text-indigo-600 outline-none shadow-sm"
              />
            </div>
          </div>

          {showProfitSection && (
            <div className="bg-emerald-50 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-emerald-100 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit net estimé</p>
                <div className="flex items-center">
                  <span className="text-xl md:text-3xl font-black text-emerald-700">€</span>
                  <input 
                    type="number" step="0.01" value={formData.expectedProfit}
                    onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})}
                    className="bg-transparent border-none p-0 text-3xl md:text-5xl font-black text-emerald-700 focus:ring-0 w-full"
                    readOnly={formData.type === TransactionType.CLIENT_ORDER}
                  />
                </div>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-xl md:text-2xl shadow-sm border border-emerald-100/50">💎</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <input
              type="text" value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              className="w-full px-6 py-4 md:py-6 bg-slate-50 border-none rounded-xl md:rounded-3xl font-bold placeholder:text-slate-300 text-sm md:text-base"
              placeholder="Nom du Projet / Objet"
            />
            <input
              type="text" value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full px-6 py-4 md:py-6 bg-slate-50 border-none rounded-xl md:rounded-3xl font-bold placeholder:text-slate-300 text-sm md:text-base"
              placeholder="Client / Note rapide"
            />
          </div>

          <button type="submit" className={`w-full text-white font-black py-6 md:py-10 rounded-2xl md:rounded-[2.5rem] text-lg md:text-2xl transition-all uppercase tracking-[0.2em] shadow-2xl active:scale-95 ${
            formData.owner === Owner.LARBI ? 'bg-indigo-600 shadow-indigo-200' : 'bg-purple-600 shadow-purple-200'
          }`}>
            Sauvegarder le flux
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;