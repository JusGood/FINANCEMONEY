
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';
import { getCryptoPrices } from '../services/geminiService';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CRYPTO_ASSETS = ['LTC', 'BTC', 'ETH', 'USDT', 'SOL'];
const FALLBACK_PRICES: Record<string, number> = { 
  "BTC": 95000, 
  "ETH": 2600, 
  "LTC": 92, 
  "SOL": 185, 
  "USDT": 1 
};

// Fix: Complete the TransactionForm component and add default export.
const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, onDelete, initialData, onCancel }) => {
  const [livePrices, setLivePrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '0',
    productPrice: '',
    feePercentage: '10',
    expectedProfit: '0',
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    type: TransactionType.CLIENT_ORDER,
    account: AccountType.BANK,
    owner: Owner.LARBI,
    toOwner: Owner.YASSINE,
    note: '',
    projectName: '',
    clientName: '',
    isSold: false, 
    method: 'Standard' as OperationMethod,
    assetSymbol: 'LTC',
    assetQuantity: ''
  });

  // Fetch real-time index
  const updatePrices = useCallback(async () => {
    setIsFetchingPrice(true);
    try {
      const prices = await getCryptoPrices(CRYPTO_ASSETS);
      setLivePrices(prev => ({ ...prev, ...prices }));
    } catch (e) {
      console.error("Erreur de récupération des prix", e);
    } finally {
      setIsFetchingPrice(false);
    }
  }, []);

  useEffect(() => {
    updatePrices();
  }, [updatePrices]);

  // Calculate Euro Profit automatically for Client Orders
  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER) {
      const price = parseFloat(formData.productPrice || '0');
      const fee = parseFloat(formData.feePercentage || '10');
      const profit = (price * (fee / 100)).toFixed(2);
      setFormData(prev => ({ ...prev, expectedProfit: profit, amount: '0' }));
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

  // Calculate Crypto Quantity automatically based on External Index
  useEffect(() => {
    if (formData.account === AccountType.CRYPTO && parseFloat(formData.expectedProfit) > 0) {
      const profitEuro = parseFloat(formData.expectedProfit);
      const currentPrice = livePrices[formData.assetSymbol] || FALLBACK_PRICES[formData.assetSymbol] || 1;
      const qty = (profitEuro / currentPrice).toFixed(8);
      
      setFormData(prev => ({ ...prev, assetQuantity: qty }));
    } else if (formData.account !== AccountType.CRYPTO) {
      setFormData(prev => ({ ...prev, assetQuantity: '' }));
    }
  }, [formData.expectedProfit, formData.assetSymbol, formData.account, livePrices]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: (initialData.amount || 0).toString(),
        productPrice: initialData.productPrice?.toString() || '',
        feePercentage: initialData.feePercentage?.toString() || '10',
        expectedProfit: (initialData.expectedProfit || 0).toString(),
        date: initialData.date,
        category: initialData.category,
        type: initialData.type,
        account: initialData.account,
        owner: initialData.owner,
        toOwner: initialData.toOwner || Owner.YASSINE,
        note: initialData.note || '',
        projectName: initialData.projectName || '',
        clientName: initialData.clientName || '',
        isSold: initialData.isSold || false,
        method: initialData.method || 'Standard',
        assetSymbol: initialData.assetSymbol || 'LTC',
        assetQuantity: (initialData.assetQuantity || 0).toString()
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCrypto = formData.account === AccountType.CRYPTO;
    
    const transactionData: Omit<Transaction, 'id'> = {
      amount: parseFloat(formData.amount || '0'),
      productPrice: formData.type === TransactionType.CLIENT_ORDER ? parseFloat(formData.productPrice || '0') : undefined,
      feePercentage: formData.type === TransactionType.CLIENT_ORDER ? parseFloat(formData.feePercentage || '10') : undefined,
      expectedProfit: parseFloat(formData.expectedProfit || '0'),
      date: formData.date,
      category: formData.category,
      type: formData.type,
      account: formData.account,
      owner: formData.owner,
      toOwner: formData.type === TransactionType.TRANSFER ? formData.toOwner : undefined,
      note: formData.note,
      projectName: formData.projectName,
      clientName: formData.clientName,
      isSold: formData.isSold,
      method: formData.method,
      assetSymbol: isCrypto ? formData.assetSymbol : undefined,
      assetQuantity: isCrypto ? (parseFloat(formData.assetQuantity) || 0) : undefined
    };

    if (initialData && onUpdate) {
      onUpdate(initialData.id, { ...transactionData, id: initialData.id } as Transaction);
    } else {
      onAdd(transactionData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">
          {initialData ? 'Modifier Opération' : 'Nouvelle Opération'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">
            Annuler
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Type d'opération</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
          >
            {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Compte de Destination</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.account}
            onChange={e => setFormData({...formData, account: e.target.value as AccountType})}
          >
            {Object.values(AccountType).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Agent Responsable</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.owner}
            onChange={e => setFormData({...formData, owner: e.target.value as Owner})}
          >
            <option value={Owner.LARBI}>Larbi</option>
            <option value={Owner.YASSINE}>Yassine</option>
          </select>
        </div>
      </div>

      {formData.type === TransactionType.TRANSFER && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Vers l'Agent</label>
          <select 
            className="w-full bg-indigo-50 dark:bg-indigo-950/30 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.toOwner}
            onChange={e => setFormData({...formData, toOwner: e.target.value as Owner})}
          >
            <option value={Owner.LARBI}>Larbi</option>
            <option value={Owner.YASSINE}>Yassine</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Nom du Projet / Produit</label>
          <input 
            type="text"
            placeholder="Ex: iPhone 15 Pro, Amazon Order #123..."
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.projectName}
            onChange={e => setFormData({...formData, projectName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Catégorie</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formData.type === TransactionType.CLIENT_ORDER ? (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Prix Produit (€)</label>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs border-none outline-none focus:ring-2 focus:ring-indigo-600"
                value={formData.productPrice}
                onChange={e => setFormData({...formData, productPrice: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Commission (%)</label>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs border-none outline-none focus:ring-2 focus:ring-indigo-600"
                value={formData.feePercentage}
                onChange={e => setFormData({...formData, feePercentage: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500 ml-4 tracking-widest">Gain Estimé (€)</label>
              <input 
                type="number"
                readOnly
                className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl font-black text-xs border-none outline-none"
                value={formData.expectedProfit}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2 col-span-1 md:col-span-3">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Montant (€)</label>
            <input 
              type="number"
              className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs border-none outline-none focus:ring-2 focus:ring-indigo-600"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value, expectedProfit: e.target.value})}
            />
          </div>
        )}
      </div>

      {formData.account === AccountType.CRYPTO && (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-200 dark:border-amber-900/30 space-y-4">
           <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🪙</span>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500">Configuration Crypto-Actif</h4>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-amber-600/60 ml-2">Symbole</label>
               <select 
                 className="w-full bg-white dark:bg-slate-900 dark:text-white p-3 rounded-xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-amber-500"
                 value={formData.assetSymbol}
                 onChange={e => setFormData({...formData, assetSymbol: e.target.value})}
               >
                 {CRYPTO_ASSETS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-amber-600/60 ml-2">Quantité (Auto-Index)</label>
               <div className="relative">
                 <input 
                   type="number"
                   step="any"
                   className="w-full bg-white dark:bg-slate-900 dark:text-white p-3 rounded-xl font-black text-xs border-none outline-none focus:ring-2 focus:ring-amber-500 pr-12"
                   value={formData.assetQuantity}
                   onChange={e => setFormData({...formData, assetQuantity: e.target.value})}
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   {isFetchingPrice ? <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div> : <span className="text-[9px] font-black text-amber-500">{formData.assetSymbol}</span>}
                 </div>
               </div>
             </div>
           </div>
           <p className="text-[8px] font-bold text-amber-600/50 uppercase italic px-2">Index Coinbase Actuel: 1 {formData.assetSymbol} = {(livePrices[formData.assetSymbol] || 0).toLocaleString('fr-FR')}€</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Date de l'opération</label>
          <input 
            type="date"
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Méthode d'opération</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl font-black text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-600"
            value={formData.method}
            onChange={e => setFormData({...formData, method: e.target.value as OperationMethod})}
          >
            <option value="Standard">Standard</option>
            <option value="FTID">FTID</option>
            <option value="DNA">DNA</option>
            <option value="EB">EB</option>
            <option value="LIT">LIT</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-4 tracking-widest">Notes Agent (Optionnel)</label>
        <textarea 
          className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-6 rounded-3xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600 min-h-[100px] border-none"
          value={formData.note}
          onChange={e => setFormData({...formData, note: e.target.value})}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <button type="submit" className="flex-1 bg-slate-950 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-600 shadow-xl transition-all active:scale-95">
          {initialData ? 'METTRE À JOUR LE VAULT' : 'SCELLER L\'OPÉRATION'}
        </button>
        {initialData && onDelete && (
          <button type="button" onClick={() => onDelete(initialData.id)} className="bg-rose-500/10 text-rose-500 px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-white transition-all">
            SUPPRIMER
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
