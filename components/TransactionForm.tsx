
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
    const isTransfer = formData.type === TransactionType.TRANSFER;
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
      toOwner: isTransfer ? formData.toOwner : undefined,
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
  const isTransfer = formData.type === TransactionType.TRANSFER;
  const isCrypto = formData.account === AccountType.CRYPTO;

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[5rem] border border-slate-200 dark:border-slate-800 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.2)] relative overflow-hidden transition-all duration-700">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[150px] rounded-full"></div>
        
        <div className="flex items-center justify-between mb-16 relative z-10">
           <button onClick={onCancel} type="button" className="group flex items-center gap-3 text-slate-400 font-black text-[12px] uppercase hover:text-indigo-600 transition-all tracking-[0.4em]">
             <span className="group-hover:-translate-x-2 transition-transform">←</span> Annuler l'Audit
           </button>
           <div className="text-center space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-[0.6em] text-slate-950 dark:text-white italic">
                SÉCURISER <span className="text-indigo-600">LE FLUX</span>
              </h3>
              <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.5em]">Alpha Protocol 2027</p>
           </div>
           <div className="w-32 h-1 bg-slate-100 dark:bg-slate-800 rounded-full hidden md:block"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-16 relative z-10">
          {/* Switch Agent Luxury */}
          <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[2.5rem] flex gap-3 border border-slate-100 dark:border-slate-800">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${formData.owner === o ? 'bg-slate-950 dark:bg-indigo-600 text-white shadow-2xl scale-105' : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-[0.3em] italic">Catégorie du Mouvement</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2.5rem] font-black text-xs uppercase border-none outline-none focus:ring-[6px] focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer text-center">
                <option value={TransactionType.CLIENT_ORDER}>💼 Commande Client</option>
                <option value={TransactionType.INVESTMENT}>📈 Achat Stock Flip</option>
                <option value={TransactionType.INCOME}>💰 Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>💸 Frais de Dossier</option>
                <option value={TransactionType.TRANSFER}>⇄ Virement Interne</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-[0.3em] italic">Compte de Stockage</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2.5rem] font-black text-xs uppercase border-none outline-none focus:ring-[6px] focus:ring-indigo-500/10 transition-all appearance-none text-center">
                <option value={AccountType.BANK}>🏦 Banque de Dépôt</option>
                <option value={AccountType.CRYPTO}>🪙 Portefeuille Froid</option>
                <option value={AccountType.CASH}>💵 Réserve Liquide</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-[0.3em] italic">Méthodologie</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2.5rem] font-black text-xs uppercase border-none outline-none focus:ring-[6px] focus:ring-indigo-500/10 transition-all text-center">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID Protocol</option>
                <option value="DNA">DNA Scan</option>
                <option value="EB">EB Method</option>
                <option value="LIT">LIT Expert</option>
              </select>
            </div>
          </div>

          {/* Conditional Intelligence Sections */}
          {isCommission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-[4rem] border border-indigo-500/10 animate-in fade-in slide-in-from-top-6 duration-700">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-indigo-500 ml-6 tracking-widest italic">Prix Public Produit (€)</label>
                <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-2xl outline-none border-none shadow-inner text-center tabular-nums" placeholder="1500.00" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-indigo-500 ml-6 tracking-widest italic">Marge de Commission (%)</label>
                <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-2xl outline-none border-none shadow-inner text-center tabular-nums" />
              </div>
            </div>
          )}

          {isInvestment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[4rem] border border-emerald-500/10 animate-in fade-in slide-in-from-top-6 duration-700">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-emerald-500 ml-6 tracking-widest italic">Capital Immobilisé (Mise)</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-2xl outline-none border-none shadow-inner text-center" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-emerald-500 ml-6 tracking-widest italic">Objectif Profit Net (€)</label>
                <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-2xl outline-none border-none shadow-inner text-center" />
              </div>
            </div>
          )}

          {isTransfer && (
            <div className="p-12 bg-purple-500/5 dark:bg-purple-500/10 rounded-[4rem] border border-purple-500/10 animate-in fade-in slide-in-from-top-6">
              <div className="max-w-xl mx-auto space-y-4">
                <label className="text-[11px] font-black uppercase text-purple-500 ml-6 italic tracking-[0.3em]">Cible de Virement Interne :</label>
                <select value={formData.toOwner} onChange={(e) => setFormData({...formData, toOwner: e.target.value as Owner})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-[2.5rem] font-black text-lg uppercase outline-none border-none cursor-pointer text-center">
                   <option value={Owner.LARBI}>Larbi (Central Protocol)</option>
                   <option value={Owner.YASSINE}>Yassine (Central Protocol)</option>
                </select>
              </div>
            </div>
          )}

          {isCrypto && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12 bg-amber-500/5 dark:bg-amber-500/10 rounded-[4rem] border border-amber-500/10 animate-in fade-in slide-in-from-top-6">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-amber-500 ml-6 tracking-widest">Actif Digital</label>
                <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-xl uppercase outline-none border-none text-center">
                  {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-amber-500 ml-6 tracking-widest">Volume (Unités Précises)</label>
                <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-8 bg-white dark:bg-slate-900 dark:text-white rounded-3xl font-black text-xl outline-none border-none text-center tabular-nums" placeholder="0.0000" />
              </div>
            </div>
          )}

          {/* Central Quantum Card */}
          {!isInvestment && (
            <div className="p-20 bg-slate-950 dark:bg-black rounded-[5rem] text-center border border-white/10 relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-emerald-600/10 opacity-50"></div>
              <p className="relative z-10 text-[11px] font-black uppercase text-indigo-400 mb-10 tracking-[1em] italic leading-none">QUANTUM DÉTERMINISTE</p>
              <div className="relative z-10 flex items-center justify-center gap-8">
                 <input
                  type="number" required step="0.01" 
                  value={isCommission ? formData.expectedProfit : formData.amount}
                  onChange={(e) => setFormData({...formData, [isCommission ? 'expectedProfit' : 'amount']: e.target.value})}
                  className="w-full bg-transparent text-center text-[10rem] font-black text-white outline-none tabular-nums tracking-tighter leading-none"
                  placeholder="0.00"
                />
                <span className="text-6xl font-black text-white/20 italic">€</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-8 tracking-[0.4em] italic">Code de Projet Alpha</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2.5rem] font-black text-sm uppercase outline-none border-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center" placeholder="Ex: STOCK-04-IPHONE-15" />
            </div>
            <div className="space-y-4">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-8 tracking-[0.4em] italic">Identité du Client</label>
               <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[2.5rem] font-black text-sm uppercase outline-none border-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center" placeholder="ID Client Privé..." />
            </div>
          </div>

          <div className="flex items-center justify-between px-12 py-10 bg-slate-50 dark:bg-slate-800/30 rounded-[3.5rem] border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[13px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em] italic block">Validation d'Audit</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Confirmer la réception physique de l'argent ?</span>
            </div>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-20 h-12 rounded-full relative transition-all duration-700 shadow-2xl ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-2 w-8 h-8 bg-white rounded-full transition-all duration-700 shadow-xl ${formData.isSold ? 'left-10' : 'left-2'}`}></div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
             <button type="submit" className="flex-1 bg-slate-950 dark:bg-indigo-600 text-white font-black py-10 rounded-[3rem] text-sm uppercase tracking-[0.6em] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                {initialData ? 'METTRE À JOUR AUDIT' : 'SÉCURISER FLUX'} <Icons.Plus />
             </button>
             {initialData && onDelete && (
               <button type="button" onClick={() => onDelete(initialData.id)} className="px-12 bg-rose-500/10 text-rose-500 font-black rounded-[3rem] text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg">
                 Effacer Audit
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
