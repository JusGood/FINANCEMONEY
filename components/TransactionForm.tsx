
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
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
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] opacity-20 -mr-20 -mt-20 transition-colors duration-700 ${formData.owner === Owner.LARBI ? 'bg-indigo-600' : 'bg-purple-600'}`}></div>
        
        <div className="flex items-center justify-between mb-12">
           <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 font-black text-xs uppercase tracking-widest">
             ← Annuler
           </button>
           <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
            {initialData ? 'Editer le Flux' : 'Nouvelle Opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          {/* Owner Toggle */}
          <div className="bg-slate-50 p-2 rounded-[2rem] flex gap-2">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button
                key={o}
                type="button"
                onClick={() => setFormData({...formData, owner: o})}
                className={`flex-1 py-5 rounded-[1.8rem] font-black text-sm transition-all duration-300 ${
                  formData.owner === o 
                  ? (o === Owner.LARBI ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-purple-600 text-white shadow-xl shadow-purple-100')
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {o.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Type d'opération</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
              >
                <option value={TransactionType.CLIENT_ORDER}>👤 Commande Client</option>
                <option value={TransactionType.INVESTMENT}>👟 Achat Stock (Flip)</option>
                <option value={TransactionType.INCOME}>📈 Revenu Entrant</option>
                <option value={TransactionType.EXPENSE}>💸 Dépense / Frais</option>
                <option value={TransactionType.INITIAL_BALANCE}>💰 Solde Initial</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Compte Utilisé</label>
              <select
                value={formData.account}
                onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})}
                className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
              >
                <option value={AccountType.BANK}>🏦 Banque (Compte Principal)</option>
                <option value={AccountType.CRYPTO}>🪙 Portefeuille Crypto</option>
                <option value={AccountType.CASH}>💵 Espèces / Main à main</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Catégorie Métier</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Date du flux</label>
              <input
                type="date" value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Montant de l'opération</h4>
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input 
                  type="checkbox" checked={formData.isForecast}
                  onChange={(e) => setFormData({...formData, isForecast: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <span className="text-xs font-black text-slate-400 uppercase">Prévision</span>
              </label>
            </div>

            {formData.type === TransactionType.CLIENT_ORDER ? (
              <div className="relative">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">€</span>
                <input
                  type="number" required step="0.01" value={formData.productPrice}
                  placeholder="0.00"
                  onChange={(e) => setFormData({...formData, productPrice: e.target.value})}
                  className="w-full pl-16 pr-8 py-8 bg-white border-none rounded-[2rem] text-5xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none placeholder:text-slate-100"
                />
                <p className="mt-4 text-[10px] font-black uppercase text-slate-400 px-4">Prix de l'article pour le client</p>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">€</span>
                <input
                  type="number" required step="0.01" value={formData.amount}
                  placeholder="0.00"
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-16 pr-8 py-8 bg-white border-none rounded-[2rem] text-5xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none placeholder:text-slate-100"
                />
                <p className="mt-4 text-[10px] font-black uppercase text-slate-400 px-4">Somme réellement sortie / entrée</p>
              </div>
            )}
          </div>

          {showProfitSection && (
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="flex-1">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit Net Attendu (Bénéfice)</p>
                <div className="flex items-center">
                  <span className="text-3xl font-black text-emerald-700">€</span>
                  <input 
                    type="number" step="0.01" value={formData.expectedProfit}
                    onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})}
                    className="bg-transparent border-none p-0 text-5xl font-black text-emerald-700 focus:ring-0 w-full"
                    readOnly={formData.type === TransactionType.CLIENT_ORDER}
                  />
                </div>
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-emerald-100 animate-bounce group-hover:animate-none">💎</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input
              type="text" value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold placeholder:text-slate-300"
              placeholder="Nom du Client / Contact..."
            />
            <input
              type="text" value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold placeholder:text-slate-300"
              placeholder="Nom du Produit (ex: Jordan 4 Red Thunder)..."
            />
          </div>

          <textarea
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-bold placeholder:text-slate-300 min-h-[100px]"
            placeholder="Notes complémentaires, détails de l'opération..."
          />

          <button type="submit" className={`w-full text-white font-black py-8 rounded-[2rem] text-xl transition-all uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 ${
            formData.owner === Owner.LARBI ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
          }`}>
            Enregistrer pour {formData.owner.toUpperCase()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
