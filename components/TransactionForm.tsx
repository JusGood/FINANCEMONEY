
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
const LTC_APPROX_PRICE = 92; // Valeur indicative pour aider l'utilisateur

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

  // Logique métier : Commande Client = 0€ décaissé + 10% commission auto
  useEffect(() => {
    if (formData.type === TransactionType.CLIENT_ORDER) {
      const price = parseFloat(formData.productPrice || '0');
      const fee = parseFloat(formData.feePercentage || '10');
      const profit = (price * (fee / 100)).toFixed(2);
      
      // Mise à jour du profit et forçage du montant à 0 car on ne paie pas le produit
      setFormData(prev => {
        const updates: any = { expectedProfit: profit, amount: '0' };
        
        // Si c'est en crypto, on peut aider à estimer la quantité (facultatif mais utile)
        if (prev.account === AccountType.CRYPTO && !prev.assetQuantity) {
            updates.assetQuantity = (parseFloat(profit) / LTC_APPROX_PRICE).toFixed(4);
        }
        
        return { ...prev, ...updates };
      });
    }
  }, [formData.productPrice, formData.feePercentage, formData.type, formData.account]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        productPrice: initialData.productPrice?.toString() || '',
        feePercentage: initialData.feePercentage?.toString() || '10',
        expectedProfit: initialData.expectedProfit.toString(),
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
        assetQuantity: initialData.assetQuantity?.toString() || ''
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
    <div className="max-w-2xl mx-auto py-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
           <button onClick={onCancel} type="button" className="text-slate-400 font-bold text-xs uppercase hover:text-indigo-600 transition-all">
             ← Annuler
           </button>
           <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
            {initialData ? 'Modifier opération' : 'Nouvelle opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'Agent */}
          <div className="flex gap-2">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${formData.owner === o ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Stock (Flip)</option>
                <option value={TransactionType.INCOME}>Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>Virement Interne</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mode de gain</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value={AccountType.BANK}>Banque</option>
                <option value={AccountType.CRYPTO}>Crypto</option>
                <option value={AccountType.CASH}>Espèces</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Méthode</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
            {isClientOrder && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-500 ml-1">Prix Commande (€)</label>
                  <input type="number" step="0.01" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" placeholder="Ex: 1200" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-500 ml-1">Com. (%)</label>
                  <input type="number" step="0.1" value={formData.feePercentage} onChange={(e) => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" />
                </div>
              </div>
            )}

            {isInvestment && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Mon investissement (€)</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" placeholder="Ex: 500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Bénéfice prévu (€)</label>
                  <input type="number" step="0.01" value={formData.expectedProfit} onChange={(e) => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" placeholder="Ex: 150" required />
                </div>
              </div>
            )}

            {isCrypto && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-amber-500 ml-1">Actif Crypto</label>
                  <select value={formData.assetSymbol} onChange={(e) => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-xs outline-none border-none">
                    {CRYPTO_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-amber-500 ml-1">Quantité Profit</label>
                  <input type="number" step="0.000001" value={formData.assetQuantity} onChange={(e) => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none border-none shadow-sm" placeholder="Ex: 1.25" />
                </div>
              </div>
            )}

            {/* Récapitulatif du Bénéfice final */}
            {(isClientOrder || formData.type === TransactionType.INCOME) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Profit à encaisser</p>
                 <div className="flex items-center justify-center gap-2">
                   <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 italic">
                     {isCrypto 
                       ? `${formData.assetQuantity || '0'} ${formData.assetSymbol}` 
                       : `${formData.expectedProfit || '0'} €`}
                   </span>
                 </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Libellé / Projet" />
            <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nom du Client" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-black uppercase text-slate-500">Transaction déjà terminée ?</span>
            <button type="button" onClick={() => setFormData({...formData, isSold: !formData.isSold})} className={`w-12 h-7 rounded-full relative transition-all duration-300 ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${formData.isSold ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-4">
             <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
                {initialData ? 'Mettre à jour' : 'Enregistrer la transaction'}
             </button>
             {initialData && onDelete && (
               <button type="button" onClick={() => onDelete(initialData.id)} className="w-full bg-rose-500 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95 shadow-md">
                 Supprimer définitivement
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
