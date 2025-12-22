
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType, AccountType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import * as DB from './services/db';
import { Icons } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        // Init logic handled elsewhere or via prompt
      } else {
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
      setTransactions(data);
      setDbError(null);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else console.error("Vault Load Error", err);
    }
  };

  const handleAddTransaction = async (d: Omit<Transaction, 'id'>) => {
    try {
      await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)});
      await loadTransactions();
      setActiveView(d.owner);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else alert("Transaction Security Breach: FAILED");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black uppercase tracking-[1em] text-[11px] italic">
      <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_50px_rgba(79,70,229,0.3)]"></div>
      DÉCRYPTAGE DU VAULT ALPHA...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-xl w-full bg-white/5 backdrop-blur-3xl p-20 rounded-[5rem] border border-white/10 shadow-[0_50px_150px_-30px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[100px]"></div>
          
          <div className="mb-16">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">MILLIONAIRE <br/><span className="text-indigo-600">EN 2027</span></h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mt-6 leading-relaxed">Secure Terminal Authentication Required</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé. Riguer absolue obligatoire.");
          }} className="space-y-8">
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] ml-6">Identifiant Alpha</label>
              <input name="email" type="email" placeholder="agent@vault.com" className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-white text-lg outline-none focus:ring-[6px] focus:ring-indigo-600/20 transition-all font-bold tracking-widest text-center" required />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] ml-6">Clé d'Accès</label>
              <input name="password" type="password" placeholder="••••••••••••" className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-white text-lg outline-none focus:ring-[6px] focus:ring-indigo-600/20 transition-all font-bold tracking-widest text-center" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.8em] transition-all hover:bg-indigo-500 hover:scale-[1.02] shadow-[0_30px_60px_-10px_rgba(79,70,229,0.4)] active:scale-95 italic">DÉVERROUILLER</button>
          </form>
          
          <div className="mt-12 flex justify-center gap-6 opacity-20 grayscale">
            <span className="text-[10px] font-black">L-AUDIT</span>
            <span className="text-[10px] font-black">Y-PROTO</span>
            <span className="text-[10px] font-black">B-CENTRAL</span>
          </div>
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
            if (confirm("EFFACER L'AUDIT DÉFINITIVEMENT ?")) {
              await DB.deleteTransactionDB(id);
              await loadTransactions();
              setActiveView(Owner.GLOBAL);
            }
          }}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="flex flex-col gap-20 animate-in fade-in duration-1000 pb-40">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               
               if (tx.type === TransactionType.INCOME) {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
               } else {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
                 await DB.saveTransaction({
                   id: Math.random().toString(36).substr(2, 9),
                   date: new Date().toISOString().split('T')[0],
                   amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                   category: tx.category, type: TransactionType.INCOME, account: tx.account,
                   owner: tx.owner, note: `Audit Clos [REF:${tx.id}] : ${tx.projectName}`, isSold: true, method: tx.method
                 });
               }
               await loadTransactions();
            }} 
          />

          {dbError && (
            <div className="bg-rose-600 p-10 rounded-[3rem] text-white shadow-2xl animate-bounce">
               <h5 className="font-black uppercase text-xs tracking-[0.5em] mb-4">⚠️ PROTOCOLE DE MISE À JOUR VAULT</h5>
               <pre className="text-[11px] bg-black/40 p-6 rounded-2xl whitespace-pre-wrap font-mono select-all text-emerald-400 border border-emerald-400/20">
                 {dbError}
               </pre>
            </div>
          )}

          {/* Audit Journal Alpha - GHOST MODE 0.60 */}
          <div className="bg-white dark:bg-slate-900 rounded-[5rem] border border-slate-200 dark:border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="px-14 py-10 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-10">
              <div className="space-y-1">
                <h4 className="font-black uppercase text-[14px] tracking-[0.8em] text-slate-950 dark:text-white italic">Audit Journal Alpha</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Chronologie des Flux de Capital</p>
              </div>
              <div className="flex-1 max-w-lg">
                <div className="relative group">
                   <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-30">
                      <Icons.Pencil />
                   </div>
                   <input 
                    type="text" 
                    placeholder="RECHERCHER DOSSIER / CLIENT / AGENT..." 
                    className="w-full bg-white dark:bg-slate-950 rounded-[2rem] pl-16 pr-8 py-5 text-[12px] font-black uppercase outline-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-4 focus:ring-indigo-600 border-none transition-all placeholder:text-slate-300" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/20 text-slate-400 text-[11px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-14 py-8 tracking-[0.4em] italic">Identification</th>
                    <th className="px-14 py-8 tracking-[0.4em] italic">Protocole</th>
                    <th className="px-14 py-8 tracking-[0.4em] italic text-center">Agents Responsables</th>
                    <th className="px-14 py-8 tracking-[0.4em] italic">Audit Statut</th>
                    <th className="px-14 py-8 text-right tracking-[0.4em] italic">Valeur</th>
                    <th className="px-14 py-8 text-center tracking-[0.4em] italic">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView || t.toOwner === activeView) && (!searchTerm || (t.projectName || t.category || t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => {
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      const displayAmount = t.type === TransactionType.CLIENT_ORDER ? (t.expectedProfit || 0) : t.amount;
                      // GHOST MODE 0.60 Opacity for pending audits
                      const isPending = !t.isSold && (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INVESTMENT);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 dark:hover:bg-indigo-600/5 transition-all group ${isPending ? 'opacity-50 bg-amber-500/[0.03]' : ''}`}>
                          <td className="px-14 py-10">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[15px] text-slate-950 dark:text-white truncate max-w-[350px] tracking-tighter group-hover:text-indigo-600 transition-colors italic leading-none">{t.projectName || t.category}</span>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-[10px] text-slate-400 font-black tabular-nums uppercase border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">{t.date}</span>
                                {t.clientName && <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] italic">/ {t.clientName}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-14 py-10">
                            <div className="flex flex-col gap-2">
                              <span className={`w-fit text-[10px] font-black px-5 py-2.5 rounded-2xl uppercase tracking-[0.3em] ${t.type === TransactionType.TRANSFER ? 'bg-indigo-600 text-white shadow-lg' : t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                {t.type} {t.method !== 'Standard' ? `[${t.method}]` : ''}
                              </span>
                              {t.account === AccountType.CRYPTO && (
                                <span className="text-[11px] font-black text-amber-500 uppercase italic ml-2 tracking-widest flex items-center gap-2">🪙 {t.assetQuantity} {t.assetSymbol}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-14 py-10">
                            {t.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center justify-center gap-4 text-[13px] font-black uppercase italic">
                                <span className="text-rose-500 bg-rose-500/5 px-4 py-2 rounded-xl">{t.owner}</span>
                                <span className="text-slate-300 animate-pulse">➜</span>
                                <span className="text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-xl">{t.toOwner}</span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-[14px] font-black uppercase text-indigo-600 dark:text-indigo-400 italic bg-indigo-500/5 px-6 py-3 rounded-2xl border border-indigo-500/10 shadow-sm">{t.owner}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-14 py-10">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${t.isSold ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></div>
                                <span className={`text-[10px] font-black px-6 py-3 rounded-2xl uppercase tracking-[0.3em] italic ${t.isSold ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                  {t.isSold ? 'AUDIT CLOS' : 'HORS CAISSE'}
                                </span>
                             </div>
                          </td>
                          <td className={`px-14 py-10 text-right font-black tabular-nums text-2xl tracking-tighter italic ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{displayAmount.toLocaleString()}€
                          </td>
                          <td className="px-14 py-10 text-center">
                            <div className="flex items-center justify-center gap-6">
                              <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-all opacity-10 group-hover:opacity-100 text-2xl shadow-xl">✏️</button>
                            </div>
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
