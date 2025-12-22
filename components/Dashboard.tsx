
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Owner, AccountType } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport, getCryptoPrices } from '../services/geminiService';
import { Icons } from '../constants';

interface Props {
  transactions: Transaction[];
  ownerFilter: Owner;
  onConfirmSale: (txId: string) => void;
}

const Dashboard: React.FC<Props> = ({ transactions, ownerFilter, onConfirmSale }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  const filtered = useMemo(() => 
    ownerFilter === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === ownerFilter || t.toOwner === ownerFilter)
  , [transactions, ownerFilter]);

  const cryptoHoldings = useMemo(() => {
    const holdings: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.account === AccountType.CRYPTO && t.assetSymbol && t.assetQuantity) {
        const isIncoming = (
          (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || t.type === TransactionType.CLIENT_ORDER) ||
          (t.type === TransactionType.TRANSFER && t.toOwner === ownerFilter)
        );
        const qty = isIncoming ? (t.assetQuantity || 0) : -(t.assetQuantity || 0);
        holdings[t.assetSymbol] = (holdings[t.assetSymbol] || 0) + qty;
      }
    });
    return holdings;
  }, [filtered, ownerFilter]);

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = Object.keys(cryptoHoldings);
      if (symbols.length > 0) {
        try {
          const prices = await getCryptoPrices(symbols);
          setCryptoPrices(prices || {});
        } catch (e) {
          console.debug("Prix indisponibles.");
        }
      }
    };
    fetchPrices();
  }, [cryptoHoldings]);

  const cryptoValue = useMemo(() => {
    return (Object.entries(cryptoHoldings) as [string, number][]).reduce((sum, [symbol, qty]) => {
      return sum + (qty * (cryptoPrices[symbol] || 0));
    }, 0);
  }, [cryptoHoldings, cryptoPrices]);

  const stats = useMemo(() => filtered.reduce((acc, curr) => {
    if (curr.account === AccountType.CRYPTO) return acc;
    const amount = curr.amount || 0;
    const profit = curr.expectedProfit || 0;

    if (ownerFilter === Owner.GLOBAL) {
      if (curr.type === TransactionType.TRANSFER) return acc;
      if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
      else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
      else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
      else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
      else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
    } else {
      if (curr.type === TransactionType.TRANSFER) {
        if (curr.owner === ownerFilter) acc.expense += amount;
        if (curr.toOwner === ownerFilter) acc.income += amount;
      } else if (curr.owner === ownerFilter) {
        if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
        else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
        else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
        else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
        else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
      }
    }
    return acc;
  }, { initial: 0, income: 0, expense: 0, invested: 0 }), [filtered, ownerFilter]);

  const fiatCash = (stats.initial || 0) + (stats.income || 0) - (stats.expense || 0) - (stats.invested || 0);
  const currentTotalCash = fiatCash + cryptoValue;

  const pendingItems = useMemo(() => {
    return filtered
      .filter(t => (ownerFilter === Owner.GLOBAL || t.owner === ownerFilter) && (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && !t.isSold)
      .map(t => ({
        name: t.projectName || t.category || 'Sans nom',
        profit: t.expectedProfit || 0,
        id: t.id,
        type: t.type,
        asset: t.account === AccountType.CRYPTO ? t.assetSymbol : '€',
        qty: t.assetQuantity || 0
      }));
  }, [filtered, ownerFilter]);

  const fetchAiReport = async () => {
    setLoadingReport(true);
    try {
      const report = await getFinancialHealthReport(filtered, ownerFilter);
      setAiReport(report);
    } catch (e) {
      setAiReport("Conseil indisponible. Vérifiez la connexion.");
    }
    setLoadingReport(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">SOLDE CONSOLIDÉ</p>
              <button onClick={() => setShowDetails(!showDetails)} className="text-[9px] font-bold bg-white/5 text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                {showDetails ? 'MASQUER' : 'DÉTAILS'}
              </button>
            </div>
            
            <div className="flex items-baseline gap-2 mb-8">
              <h2 className="text-4xl font-black tabular-nums text-white">
                {(currentTotalCash || 0).toLocaleString('fr-FR')}
              </h2>
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest italic">EUR</span>
            </div>
            
            <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-6">
               <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">ESPÈCES/BANQUE</p>
                  <p className="text-xl font-black text-white">{(fiatCash || 0).toLocaleString('fr-FR')}€</p>
               </div>
               <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">PORTEFEUILLE CRYPTO</p>
                  <p className="text-xl font-black text-amber-500">{(cryptoValue || 0).toLocaleString('fr-FR')}€</p>
               </div>
               <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">BÉNÉFICES PRÉVUS</p>
                  <p className="text-xl font-black text-indigo-400">
                    +{(pendingItems.reduce((sum, p) => sum + p.profit, 0) || 0).toLocaleString('fr-FR')}€
                  </p>
               </div>
            </div>

            {showDetails && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                 {(Object.entries(cryptoHoldings) as [string, number][]).filter(([_,q])=>q!==0).map(([symbol, qty]) => (
                   <div key={symbol} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-white/10">
                      <span className="text-white/40 font-black text-[10px] uppercase">{symbol}</span>
                      <div className="text-right">
                        <span className="block text-sm font-black text-white">{(qty || 0).toFixed(4)}</span>
                        <span className="text-[10px] text-emerald-500 font-bold italic">≈ {((qty || 0) * (cryptoPrices[symbol] || 0)).toLocaleString('fr-FR')}€</span>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 italic">ANALYSE RAPIDE</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                {loadingReport ? 'CALCUL...' : 'ANALYSER'}
             </button>
           </div>
           <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 italic leading-relaxed border-l-2 border-indigo-500 pl-4">
             {aiReport || "Cliquez sur Analyser pour obtenir vos conseils de gestion."}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 h-[220px] shadow-sm overflow-hidden">
           <BalanceTrendChart transactions={filtered} ownerFilter={ownerFilter} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 h-[220px] flex flex-col items-center justify-center shadow-sm overflow-hidden">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {pendingItems.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center gap-3 px-2">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">DOSSIERS À RÉCEPTIONNER ({pendingItems.length})</span>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-20"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[160px] group transition-all hover:shadow-xl hover:-translate-y-1">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'Stock' : 'Com.'}
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-500 block">+{(p.profit || 0).toLocaleString('fr-FR')}€</span>
                        {p.asset !== '€' && <span className="text-[9px] font-bold text-amber-500 block italic">{(p.qty || 0).toFixed(4)} {p.asset}</span>}
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase italic">{p.name}</p>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.id)} 
                    className="mt-4 w-full text-[9px] font-black uppercase bg-slate-950 dark:bg-indigo-600 text-white py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                  >
                    Confirmer Réception
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
