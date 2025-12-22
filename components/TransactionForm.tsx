
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full"></div>
        
        <div className="flex items-center justify-between mb-10 relative z-10">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-[10px] uppercase hover:text-indigo-600 transition-all tracking-[0.3em]">
             ← RETOUR
           </button>
           <h3 className="text-xl font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white italic">
            AUDIT <span className="text-indigo-600">PROTOTYPE</span>
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          {/* Switch Agent */}
          <div className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex gap-1.5 border border-slate-100 dark:border-slate-800">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.owner === o ? 'bg-slate-950 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">TYPE DE FLUX</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
                <option value={TransactionType.CLIENT_ORDER}>💼 COMMANDE CLIENT</option>
                <option value={TransactionType.INVESTMENT}>📈 ACHAT FLIP</option>
                <option value={TransactionType.INCOME}>💰 REVENU DIRECT</option>
                <option value={TransactionType.EXPENSE}>💸 FRAIS DOSSIER</option>
                <option value={TransactionType.TRANSFER}>⇄ TRANSFERT</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">COMPTE CIBLE</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
                <option value={AccountType.BANK}>🏦 BANQUE</option>
                <option value={AccountType.CRYPTO}>🪙 CRYPTO</option>
                <option value={AccountType.CASH}>💵 CASH</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">PROTOCOLE</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="Standard">STANDARD</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          {/* Contextual Sections */}
          {(isCommission || isInvestment || isTransfer || isCrypto) && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
              {isCommission && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-indigo-500 ml-4">PRIX PRODUIT (€)</label>
                    <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" placeholder="1000.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-indigo-500 ml-4">MARGE (%)</label>
                    <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
              {isInvestment && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-emerald-500 ml-4">MISE (€)</label>
                    <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-emerald-500 ml-4">GAIN PRÉVU (€)</label>
                    <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
              {isTransfer && (
                <div className="col-span-full space-y-2 text-center">
                  <label className="text-[9px] font-black uppercase text-purple-500 italic">DESTINATAIRE :</label>
                  <select value={formData.toOwner} onChange={(e) => setFormData({...formData, toOwner: e.target.value as Owner})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs uppercase outline-none border-none text-center">
                    <option value={Owner.LARBI}>LARBI (ALPHA)</option>
                    <option value={Owner.YASSINE}>YASSINE (ALPHA)</option>
                  </select>
                </div>
              )}
              {isCrypto && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-amber-500 ml-4">ACTIF</label>
                    <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-xs outline-none border-none">
                      {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-amber-500 ml-4">QUANTITÉ</label>
                    <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Amount Visualization */}
          {!isInvestment && (
            <div className="p-10 bg-slate-950 dark:bg-black rounded-[2rem] text-center border border-white/5 relative overflow-hidden shadow-inner group">
              <p className="text-[9px] font-black uppercase text-indigo-400 mb-6 tracking-[0.6em]">QUANTUM CALCULÉ</p>
              <div className="flex items-center justify-center gap-4">
                 <input
                  type="number" required step="0.01" 
                  value={isCommission ? formData.expectedProfit : formData.amount}
                  onChange={(e) => setFormData({...formData, [isCommission ? 'expectedProfit' : 'amount']: e.target.value})}
                  className="w-full bg-transparent text-center text-6xl font-black text-white outline-none tabular-nums tracking-tighter"
                  placeholder="0.00"
                />
                <span className="text-3xl font-black text-white/20 italic">€</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-6 tracking-widest italic">NOM DU PROJET</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[10px] uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="ID-ALPHA..." />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-6 tracking-widest italic">NOM DU CLIENT</label>
               <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[10px] uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="CLIENT-X..." />
            </div>
          </div>

          <div className="flex items-center justify-between px-8 py-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic leading-none">AUDIT CLOS DÉFINITIVEMENT ?</span>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${formData.isSold ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex gap-4">
             <button type="submit" className="flex-1 bg-slate-950 dark:bg-indigo-600 text-white font-black py-6 rounded-[1.5rem] text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                {initialData ? 'MÀJ AUDIT' : 'SÉCURISER LE FLUX'}
             </button>
             {initialData && onDelete && (
               <button type="button" onClick={() => onDelete(initialData.id)} className="px-6 bg-rose-500/10 text-rose-500 font-black rounded-[1.5rem] text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                 EFFACER
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
