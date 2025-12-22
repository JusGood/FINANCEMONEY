
import React, { useState, useEffect } from 'react';
import { Transaction, AccountType, TransactionType, CATEGORIES, Owner, OperationMethod } from '../types';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CRYPTO_ASSETS = ['LTC', 'BTC', 'ETH', 'USDT', 'SOL'];

const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, onDelete, initialData, onCancel }) => {
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

  // Calcul auto de la commission (10% par défaut)
  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER) {
      const price = parseFloat(formData.productPrice || '0');
      const fee = parseFloat(formData.feePercentage || '10');
      const profit = (price * (fee / 100)).toFixed(2);
      setFormData(prev => ({ ...prev, expectedProfit: profit, amount: '0' }));
    }
  }, [formData.productPrice, formData.feePercentage, formData.type]);

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

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
  const isInvestment = formData.type === TransactionType.INVESTMENT;
  const isCrypto = formData.account === AccountType.CRYPTO;

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-bold text-xs uppercase hover:text-indigo-600">
             ← Retour
           </button>
           <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
            {initialData ? 'Modifier l\'Opération' : 'Nouvelle Opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${formData.owner === o ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[10px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Stock (Flip)</option>
                <option value={TransactionType.INCOME}>Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>Frais / Sortie</option>
                <option value={TransactionType.TRANSFER}>Virement Interne</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Réception Gain</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[10px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={AccountType.BANK}>Banque (Euros)</option>
                <option value={AccountType.CRYPTO}>Crypto (Actif)</option>
                <option value={AccountType.CASH}>Espèces</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Méthode</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-[10px] border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-5 border border-slate-100 dark:border-slate-800">
            {isClientOrder && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-indigo-500 uppercase">Prix Commande (€)</label>
                  <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none shadow-sm" placeholder="Ex: 1200" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-indigo-500 uppercase">Ma Commission (%)</label>
                  <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none shadow-sm" />
                </div>
              </div>
            )}

            {isInvestment && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-500 uppercase">Sortie d'argent (€)</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none shadow-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-500 uppercase">Bénéfice Visé (€)</label>
                  <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none shadow-sm" required />
                </div>
              </div>
            )}

            {isCrypto && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-500 uppercase">Actif (Monnaie)</label>
                  <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-xs outline-none">
                    {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-500 uppercase">Quantité de Gain</label>
                  <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none shadow-sm" placeholder="Ex: 0.85" required={isCrypto} />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bénéfice à Encaisser</p>
               <div className="flex items-center justify-center gap-2">
                 <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 italic">
                   {isCrypto ? `${formData.assetQuantity || '0'} ${formData.assetSymbol}` : `${formData.expectedProfit} €`}
                 </span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Libellé / Dossier" />
            <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Nom du Client" />
          </div>

          <div className="flex flex-col gap-3 pt-4">
             <button type="submit" className="w-full bg-slate-950 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
                {initialData ? 'Mettre à jour' : 'Sauvegarder l\'Opération'}
             </button>
             {initialData && onDelete && (
               <button type="button" onClick={() => onDelete(initialData.id)} className="w-full bg-rose-500/10 text-rose-500 font-black py-3 rounded-2xl text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all">
                 Supprimer ce dossier
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
