
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
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-bold text-[10px] uppercase hover:text-indigo-600 transition-all">
             ← Annuler
           </button>
           <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Nouvelle Opération
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Agent Selector */}
          <div className="max-w-xs mx-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${formData.owner === o ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Type d'opération</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value={TransactionType.CLIENT_ORDER}>💼 Commande Client</option>
                <option value={TransactionType.INVESTMENT}>📈 Achat de Stock</option>
                <option value={TransactionType.INCOME}>💰 Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>💸 Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>⇄ Virement Interne</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Moyen</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value={AccountType.BANK}>🏦 Banque</option>
                <option value={AccountType.CRYPTO}>🪙 Crypto</option>
                <option value={AccountType.CASH}>💵 Espèces</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Méthode</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          {/* Dynamic Content */}
          {(isCommission || isInvestment || isTransfer || isCrypto) && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5">
              {isCommission && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-indigo-500 ml-2">Prix de vente (€)</label>
                    <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-sm outline-none border-none shadow-sm" placeholder="Ex: 1200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-indigo-500 ml-2">Commission (%)</label>
                    <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
              {isInvestment && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-emerald-500 ml-2">Coût d'achat (€)</label>
                    <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-emerald-500 ml-2">Gain visé (€)</label>
                    <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
              {isTransfer && (
                <div className="col-span-full space-y-1">
                  <label className="text-[9px] font-black uppercase text-purple-500 text-center block">Envoyer à :</label>
                  <select value={formData.toOwner} onChange={(e) => setFormData({...formData, toOwner: e.target.value as Owner})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-xs uppercase border-none outline-none focus:ring-2 focus:ring-purple-500 text-center">
                    <option value={Owner.LARBI}>LARBI</option>
                    <option value={Owner.YASSINE}>YASSINE</option>
                  </select>
                </div>
              )}
              {isCrypto && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-amber-500 ml-2">Actif</label>
                    <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-xs outline-none border-none">
                      {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-amber-500 ml-2">Quantité</label>
                    <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-lg font-bold text-sm outline-none border-none shadow-sm" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Main Amount visualization */}
          {!isInvestment && (
            <div className="p-8 bg-slate-900 dark:bg-black rounded-2xl text-center border border-white/5 shadow-inner">
              <p className="text-[8px] font-bold uppercase text-indigo-400 mb-4 tracking-widest">MONTANT OPÉRATION</p>
              <div className="flex items-center justify-center gap-2">
                 <input
                  type="number" required step="0.01" 
                  value={isCommission ? formData.expectedProfit : formData.amount}
                  onChange={(e) => setFormData({...formData, [isCommission ? 'expectedProfit' : 'amount']: e.target.value})}
                  className="w-full bg-transparent text-center text-4xl font-black text-white outline-none tabular-nums"
                  placeholder="0.00"
                />
                <span className="text-2xl font-black text-white/20 italic">€</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Libellé / Projet</label>
               <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: STOCK IPHONE" />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Nom du client</label>
               <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none border-none focus:ring-2 focus:ring-indigo-500" placeholder="Nom..." />
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Argent déjà reçu ?</span>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-12 h-7 rounded-full relative transition-all duration-300 ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${formData.isSold ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex gap-3">
             <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">
                {initialData ? 'Mettre à jour' : 'Enregistrer'}
             </button>
             {initialData && onDelete && (
               <button type="button" onClick={() => onDelete(initialData.id)} className="px-5 bg-rose-500/10 text-rose-500 font-bold rounded-xl text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all">
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
