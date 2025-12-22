
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType, AccountType } from './types';
import Layout, { ViewType } from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<ViewType>(Owner.GLOBAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (isConfigured) {
        const sb = DB.getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          setUser(session?.user || null);
          sb.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
          });
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      loadTransactions();
      const channel = DB.subscribeToChanges('transactions', () => loadTransactions());
      return () => { if (channel) DB.getSupabase()?.removeChannel(channel); };
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const data = await DB.getTransactions();
      setTransactions(data || []);
      setDbError(null);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else console.error("Vault Error", err);
    }
  };

  const handleAddTransaction = async (d: Omit<Transaction, 'id'>) => {
    try {
      await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)});
      await loadTransactions();
      setActiveView(d.owner);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else alert("Erreur d'enregistrement.");
    }
  };

  const handleConfirmSale = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    // On met juste à jour le statut, on ne crée pas de doublon "Revenu"
    await DB.updateTransactionDB(id, {...tx, isSold: true});
    await loadTransactions();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] italic">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      DÉCRYPTAGE DU VAULT...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10 text-center">VAULT 2027</h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Agent non reconnu.");
          }} className="space-y-6">
            <input name="email" type="email" placeholder="AGENT_ID@VAULT.COM" className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-black uppercase tracking-widest" required />
            <input name="password" type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-black tracking-widest" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-500 shadow-2xl transition-all active:scale-95">ACCÉDER AU SYSTÈME</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={handleAddTransaction} 
          onUpdate={async (id, d) => {
            await DB.updateTransactionDB(id, d);
            await loadTransactions();
            setEditingTransaction(null);
            setActiveView(d.owner);
          }} 
          onDelete={async (id) => {
            await DB.deleteTransactionDB(id);
            await loadTransactions();
            setActiveView(Owner.GLOBAL);
          }}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
          <Dashboard 
            transactions={transactions} 
            viewType={activeView as any} 
            onConfirmSale={handleConfirmSale} 
          />

          {dbError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-rose-500 text-[10px]">
               <h5 className="font-black uppercase tracking-widest mb-3 italic">SYNCHRONISATION ERROR</h5>
               <pre className="p-4 bg-black/20 rounded-xl whitespace-pre-wrap font-mono overflow-x-auto">{dbError}</pre>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-400 italic">LOGS D'OPÉRATIONS</h4>
              <div className="flex-1 max-w-[300px] ml-6">
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full bg-white dark:bg-slate-950 rounded-2xl px-6 py-3 text-[10px] font-black uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-600 transition-all border-none" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/10 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-10 py-5">IDENTIFIANT</th>
                    <th className="px-10 py-5">TYPE</th>
                    <th className="px-10 py-5 text-center">AGENT</th>
                    <th className="px-10 py-5">STATUT</th>
                    <th className="px-10 py-5 text-right">BALANCE</th>
                    <th className="px-10 py-5 text-center">...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => {
                      const baseFilter = (activeView === Owner.GLOBAL || t.owner === activeView || t.toOwner === activeView);
                      const cryptoFilter = (activeView === 'CryptoView' && t.account === AccountType.CRYPTO);
                      const searchMatch = !searchTerm || (t.projectName || t.category || t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
                      return (activeView === 'CryptoView' ? cryptoFilter : baseFilter) && searchMatch;
                    })
                    .map(t => {
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      const displayAmount = (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INCOME) ? (t.expectedProfit || 0) : (t.amount || 0);
                      const isPending = !t.isSold && (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INVESTMENT);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${isPending ? 'opacity-50 italic' : ''}`}>
                          <td className="px-10 py-6">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[12px] text-slate-900 dark:text-white italic tracking-tighter truncate max-w-[250px]">{t.projectName || t.category}</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{t.date} {t.clientName ? ` // ${t.clientName}` : ''}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${t.type === TransactionType.TRANSFER ? 'bg-indigo-600 text-white shadow-sm' : t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {t.type} {t.method !== 'Standard' ? `[${t.method}]` : ''}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            {t.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center justify-center gap-3 text-[11px] font-black uppercase italic">
                                <span className="text-rose-500">{t.owner}</span>
                                <span className="opacity-20">→</span>
                                <span className="text-emerald-500">{t.toOwner}</span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-[11px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg">{t.owner}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-6">
                             <span className={`text-[9px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${t.isSold ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10 animate-pulse'}`}>
                                {t.isSold ? 'VAULTED' : 'PENDING'}
                             </span>
                          </td>
                          <td className={`px-10 py-6 text-right font-black tabular-nums text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{(displayAmount || 0).toLocaleString('fr-FR')}€
                            {t.account === AccountType.CRYPTO && t.assetQuantity && (
                              <div className="text-[10px] text-amber-500 italic uppercase">{(t.assetQuantity || 0).toFixed(4)} {t.assetSymbol}</div>
                            )}
                          </td>
                          <td className="px-10 py-6 text-center">
                            <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-all text-lg">✏️</button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
