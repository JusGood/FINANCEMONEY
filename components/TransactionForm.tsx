
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

  // RÉTABLISSEMENT : Calcul auto du profit commission (10%)
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
  const isTransfer = formData.type === TransactionType.TRANSFER;
  const isCrypto = formData.account === AccountType.CRYPTO;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-10">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors tracking-widest">← Annuler</button>
           <h3 className="text-base font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white italic">
            {initialData ? 'Modifier l\'audit' : 'Nouvelle Entrée Vault'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Switch Agent */}
          <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1.5">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.owner === o ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 italic">Type de Flux</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={TransactionType.CLIENT_ORDER}>💼 Comm Client (10%)</option>
                <option value={TransactionType.INVESTMENT}>📈 Achat Flip / Stock</option>
                <option value={TransactionType.INCOME}>💰 Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>💸 Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>⇄ Transfert Interne</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 italic">Origine Compte</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value={AccountType.BANK}>🏦 Banque Principal</option>
                <option value={AccountType.CRYPTO}>🪙 Crypto Wallet</option>
                <option value={AccountType.CASH}>💵 Espèces / Coffre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 italic">Méthode Utilisée</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          {/* RÉTABLISSEMENT : Champs Commission (10%) */}
          {isCommission && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/20 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-indigo-400 ml-4">Prix Public du Produit (€)</label>
                <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none shadow-sm" placeholder="ex: 1200" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-indigo-400 ml-4">Commission (%)</label>
                <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none shadow-sm" />
              </div>
            </div>
          )}

          {/* RÉTABLISSEMENT : Champs Achat Flip (Mise / Profit) */}
          {isInvestment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/20 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-emerald-500 ml-4">Mise Initiale (Investi)</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none shadow-sm" placeholder="Somme déboursée" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-emerald-500 ml-4">Bénéfice Espéré (Profit Net)</label>
                <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none shadow-sm" placeholder="Gain visé" />
              </div>
            </div>
          )}

          {/* RÉTABLISSEMENT : Champs Transfert */}
          {isTransfer && (
            <div className="p-8 bg-purple-50 dark:bg-purple-900/10 rounded-[2.5rem] border border-purple-100 dark:border-purple-800/20 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-black uppercase text-purple-400 ml-4 italic">Envoyer à :</label>
              <select value={formData.toOwner} onChange={(e) => setFormData({...formData, toOwner: e.target.value as Owner})} className="w-full mt-2 p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none">
                <option value={Owner.LARBI}>Larbi</option>
                <option value={Owner.YASSINE}>Yassine</option>
              </select>
            </div>
          )}

          {/* Section Crypto */}
          {isCrypto && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100 dark:border-amber-800/20 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-amber-500 ml-4">Actif</label>
                <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none">
                  {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-amber-500 ml-4">Quantité</label>
                <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl font-black text-sm outline-none border-none shadow-sm" placeholder="ex: 1.7" />
              </div>
            </div>
          )}

          {/* RÉTABLISSEMENT : Bloc Montant Central */}
          {!isInvestment && (
            <div className="p-12 bg-slate-950 rounded-[3rem] text-center border border-white/5 relative overflow-hidden group shadow-inner">
              <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-all"></div>
              <p className="relative z-10 text-[11px] font-black uppercase text-indigo-400 mb-4 tracking-[0.5em]">
                {isCommission ? 'PROFIT NET ESTIMÉ' : 'SOMME À ENREGISTRER'}
              </p>
              <div className="relative z-10 flex items-center justify-center gap-4">
                 <input
                  type="number" required step="0.01" 
                  value={isCommission ? formData.expectedProfit : formData.amount}
                  onChange={(e) => setFormData({...formData, [isCommission ? 'expectedProfit' : 'amount']: e.target.value})}
                  className="w-full bg-transparent text-center text-7xl font-black text-white outline-none tabular-nums tracking-tighter"
                  placeholder="0.00"
                />
                <span className="text-4xl font-black text-white/20 italic">€</span>
              </div>
            </div>
          )}

          {/* Détails : Projet & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-4 italic tracking-widest">Dossier / Projet</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-xs uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="ex: iPhone 15 Pro Max Flip" />
            </div>
            <div className="space-y-2">
               <label className="text-[11px] font-black uppercase text-slate-400 ml-4 italic tracking-widest">Client Final</label>
               <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-xs uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="ex: Jean Dupont" />
            </div>
          </div>

          <div className="flex items-center justify-between px-8 py-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic">L'argent est-il déjà encaissé ?</span>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-14 h-8 rounded-full relative transition-all ${formData.isSold ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.isSold ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-7 rounded-[2.5rem] text-[13px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all active:scale-95">
            {initialData ? 'Mettre à jour l\'audit' : 'Valider l\'opération'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
