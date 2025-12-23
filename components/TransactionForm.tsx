
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

  // Fetch real-time prices on mount and when symbol changes
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

  // Calculate Crypto Quantity automatically based on LIVE prices
  useEffect(() => {
    if (formData.account === AccountType.CRYPTO && parseFloat(formData.expectedProfit) > 0) {
      const profitEuro = parseFloat(formData.expectedProfit);
      // Use live price if available, otherwise fallback
      const price = livePrices[formData.assetSymbol] || FALLBACK_PRICES[formData.assetSymbol] || 1;
      const qty = (profitEuro / price).toFixed(6);
      
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

    if (initialData && onUpdate) onUpdate(initialData.id, { ...initialData, ...transactionData });
    else onAdd(transactionData);
  };

  const isClientOrder = formData.type === TransactionType.CLIENT_ORDER;
  const isInvestment = formData.type === TransactionType.INVESTMENT;
  const isCrypto = formData.account === AccountType.CRYPTO;

  return (
    <div className="max-w-2xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-10">
           <button onClick={onCancel} type="button" className="text-slate-400 font-black text-[10px] uppercase hover:text-indigo-600 transition-colors">
             ← Retour
           </button>
           <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
            {initialData ? 'Modifier l\'Opération' : 'Nouvelle Opération'}
          </h3>
          <div className="w-10"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex gap-2">
            {[Owner.LARBI, Owner.YASSINE].map(o => (
              <button key={o} type="button" onClick={() => setFormData({...formData, owner: o})} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase transition-all ${formData.owner === o ? 'bg-slate-950 dark:bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {o}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Type d'Opération</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={TransactionType.CLIENT_ORDER}>Commande Client</option>
                <option value={TransactionType.INVESTMENT}>Achat Stock (Flip)</option>
                <option value={TransactionType.INCOME}>Revenu Direct</option>
                <option value={TransactionType.EXPENSE}>Dépense / Frais</option>
                <option value={TransactionType.TRANSFER}>Virement Interne</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Réception du Gain</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value as AccountType})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={AccountType.BANK}>Euros (Banque)</option>
                <option value={AccountType.CRYPTO}>Actif (Crypto)</option>
                <option value={AccountType.CASH}>Espèces</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Méthode</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as OperationMethod})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Standard">Standard</option>
                <option value="FTID">FTID</option>
                <option value="DNA">DNA</option>
                <option value="EB">EB</option>
                <option value="LIT">LIT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom du Projet / Produit</label>
              <input type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500" placeholder="EX: MACBOOK PRO M3" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Client (Optionnel)</label>
              <input type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500" placeholder="NOM DU CLIENT" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catégorie</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {isClientOrder && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Prix Produit (€)</label>
                <input type="number" value={formData.productPrice} onChange={e => setFormData({...formData, productPrice: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Com. %</label>
                <input type="number" value={formData.feePercentage} onChange={e => setFormData({...formData, feePercentage: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-emerald-500 uppercase ml-1">Profit Attendu (€)</label>
                <div className="w-full p-4 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-sm">{formData.expectedProfit} €</div>
              </div>
            </div>
          )}

          {!isClientOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Montant (€)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value, expectedProfit: formData.type === TransactionType.INVESTMENT ? formData.expectedProfit : e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {isInvestment && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-500 uppercase ml-1">Profit Estimé (€)</label>
                  <input type="number" value={formData.expectedProfit} onChange={e => setFormData({...formData, expectedProfit: e.target.value})} className="w-full p-4 bg-emerald-500/10 dark:text-white rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
            </div>
          )}

          {isCrypto && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 relative">
                <div className="absolute top-2 right-4 flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase ${isFetchingPrice ? 'animate-pulse text-amber-600' : 'text-slate-400'}`}>
                    {isFetchingPrice ? 'IA Fetching...' : `LIVE: ${livePrices[formData.assetSymbol]?.toFixed(2)}€`}
                  </span>
                  <button type="button" onClick={updatePrices} className="text-xs hover:rotate-180 transition-transform duration-500">🔄</button>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-amber-500 uppercase ml-1">Actif</label>
                  <select value={formData.assetSymbol} onChange={e => setFormData({...formData, assetSymbol: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-sm outline-none">
                    {CRYPTO_ASSETS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-amber-500 uppercase ml-1">Quantité Estimée</label>
                  <input type="number" step="any" value={formData.assetQuantity} onChange={e => setFormData({...formData, assetQuantity: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 dark:text-white rounded-xl font-black text-sm outline-none" />
                </div>
             </div>
          )}

          {formData.type === TransactionType.TRANSFER && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Destinataire</label>
              <select value={formData.toOwner} onChange={e => setFormData({...formData, toOwner: e.target.value as Owner})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={Owner.LARBI}>Larbi</option>
                <option value={Owner.YASSINE}>Yassine</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Note / Détails</label>
            <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" placeholder="Informations complémentaires..."></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            {initialData && onDelete && (
              <button type="button" onClick={() => onDelete(initialData.id)} className="px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">Supprimer</button>
            )}
            <button type="submit" className="flex-1 bg-slate-950 dark:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-500 shadow-2xl transition-all active:scale-95">
              {initialData ? 'Mettre à jour' : 'Enregistrer l\'Opération'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
