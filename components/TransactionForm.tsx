
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CRYPTO_ASSETS = ['BTC', 'ETH', 'LTC', 'SOL', 'USDT', 'XRP', 'DOGE', 'ADA', 'DOT'];

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
    isSold: false, 
    method: 'Standard' as OperationMethod,
    assetSymbol: 'LTC',
    assetQuantity: ''
  });

  // Calcul automatique du profit pour les commissions (10% par défaut)
  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER && formData.productPrice) {
      const price = parseFloat(formData.productPrice);
      const fee = parseFloat(formData.feePercentage);
      if (!isNaN(price) && !isNaN(fee)) {
        const profit = (price * (fee / 100)).toFixed(2);
        setFormData(prev => ({ ...prev, expectedProfit: profit }));
      }
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

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
        isSold: initialData.isSold || false,
        method: initialData.method || 'Standard',
        assetSymbol: initialData.assetSymbol || 'LTC',
        assetQuantity: initialData.assetQuantity?.toString() || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
    const isInvestment = formData.type === TransactionType.INVESTMENT;
    const isCrypto = formData.account === AccountType.CRYPTO;
    
    const transactionData: Omit<Transaction, 'id'> = {
      amount: isClientOrder ? 0 : Math.abs(parseFloat(formData.amount || '0')),
      productPrice: isClientOrder ? parseFloat(formData.productPrice) : undefined,
      feePercentage: isClientOrder ? parseFloat(formData.feePercentage) : undefined,
      expectedProfit: (isClientOrder || isInvestment) ? Math.abs(parseFloat(formData.expectedProfit || '0')) : 0,
      date: formData.date,
      category: formData.category,
      type: formData.type,
      account: formData.account,
      owner: formData.owner,
      toOwner: formData.type === TransactionType.TRANSFER ? formData.toOwner : undefined,
      note: formData.note,
      projectName: formData.projectName || undefined,
      clientName: formData.clientName || undefined,
      isForecast: formData.isForecast,
      isSold: formData.isSold,
      method: formData.method,
      assetSymbol: isCrypto ? formData.assetSymbol : undefined,
      assetQuantity: isCrypto ? parseFloat(formData.assetQuantity) : undefined
    };

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  const isCommission = formData.type === TransactionType.CLIENT_ORDER;
  const isInvestment = formData.type === TransactionType.INVESTMENT;
  const isCrypto = formData.account === AccountType.CRYPTO;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors tracking-widest">← Annuler</button>
           <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white italic">
            {initialData ? 'Editer Opération' : 'Nouveau Flux de Trésorerie'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.owner === o ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Activité</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-xs border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={TransactionType.CLIENT_ORDER}>💼 Comm Client (10%)</option>
                <option value={TransactionType.INVESTMENT}>📈 Achat Flip / Stock</option>
                <option value={TransactionType.INCOME}>💰 Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>💸 Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>⇄ Transfert Interne</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Compte</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-xs border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={AccountType.BANK}>🏦 Banque</option>
                <option value={AccountType.CRYPTO}>🪙 Crypto</option>
                <option value={AccountType.CASH}>💵 Espèces</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Méthode</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-xs border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          {/* Spécifique Commissions */}
          {isCommission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/20">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-400 ml-3">Prix Produit (€)</label>
                <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs border-none outline-none" placeholder="1200" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-400 ml-3">Frais (%)</label>
                <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs border-none outline-none" />
              </div>
            </div>
          )}

          {/* Spécifique Crypto */}
          {isCrypto && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-800/20">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-500 ml-3">Choisir Crypto</label>
                <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs border-none outline-none">
                  {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-500 ml-3">Quantité (ex: 1.7)</label>
                <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs border-none outline-none" placeholder="0.00" />
              </div>
            </div>
          )}

          {/* Montant Centralisé */}
          <div className="p-10 bg-slate-950 rounded-[2.5rem] text-center border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-all"></div>
            <p className="relative z-10 text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-[0.4em]">
              {(isCommission || isInvestment) ? 'Bénéfice Attendu' : 'Mouvement Cash'}
            </p>
            <div className="relative z-10 flex items-center justify-center gap-3">
               <input
                type="number" required step="0.01" 
                value={(isCommission || isInvestment) ? formData.expectedProfit : formData.amount}
                onChange={(e) => setFormData({...formData, [(isCommission || isInvestment) ? 'expectedProfit' : 'amount']: e.target.value})}
                className="w-full bg-transparent text-center text-6xl font-black text-white outline-none tabular-nums tracking-tighter"
                placeholder="0.00"
              />
              <span className="text-3xl font-black text-white/20 italic">€</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Nom du Produit / Projet</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs outline-none border-none" placeholder="ex: MacBook Pro" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Client (si commission)</label>
               <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs outline-none border-none" placeholder="Nom du client" />
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Opération réglée / Cash reçu ?</span>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-12 h-6 rounded-full relative transition-all ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${formData.isSold ? 'left-6.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
            {initialData ? 'Mettre à jour' : 'Enregistrer le Flux'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
