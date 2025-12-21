
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        // Fallback or config redirect
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
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer définitivement cette opération du Vault ?")) {
      try {
        await DB.deleteTransactionDB(id);
        await loadTransactions();
        setEditingTransaction(null);
        if (activeView === 'Add') setActiveView(Owner.GLOBAL);
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleRevertSale = async (originalTxId: string) => {
    if (confirm("Annuler l'encaissement ? Le revenu généré sera supprimé et l'article repassera en 'Ouvert'.")) {
      try {
        const originalTx = transactions.find(t => t.id === originalTxId);
        if (!originalTx) return;

        // 1. Remettre l'original en isSold: false
        await DB.updateTransactionDB(originalTxId, { ...originalTx, isSold: false });

        // 2. Trouver et supprimer les revenus associés (basés sur le tag REF dans la note)
        const relatedIncome = transactions.find(t => 
          t.type === TransactionType.INCOME && 
          t.note?.includes(`[REF:${originalTxId}]`)
        );

        if (relatedIncome) {
          await DB.deleteTransactionDB(relatedIncome.id);
        }

        await loadTransactions();
      } catch (err) {
        alert("Erreur lors de l'annulation");
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-[10px]">
      Chargement du Vault...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-xs w-full bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
          <h1 className="text-xl font-black text-white italic mb-8 uppercase">MILLIONAIRE <span className="text-indigo-500">2027</span></h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé");
          }} className="space-y-4">
            <input name="email" type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" required />
            <input name="password" type="password" placeholder="Pass" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-transform active:scale-95">Déverrouiller</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)});
            await loadTransactions();
            setActiveView(d.owner);
          }} 
          onUpdate={async (id, d) => {
            await DB.updateTransactionDB(id, d);
            await loadTransactions();
            setEditingTransaction(null);
            setActiveView(d.owner);
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-10">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               await DB.updateTransactionDB(id, {...tx, isSold: true});
               await DB.saveTransaction({
                 id: Math.random().toString(36).substr(2, 9),
                 date: new Date().toISOString().split('T')[0],
                 amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                 category: tx.category, type: TransactionType.INCOME, account: tx.account,
                 owner: tx.owner, note: `Vente [REF:${tx.id}]: ${tx.projectName}`, isSold: true, method: tx.method
               });
               await loadTransactions();
            }} 
          />

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors relative z-0">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Journal d'Audit</h4>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="FILTRER..." 
                  className="bg-white dark:bg-slate-950 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase outline-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-indigo-500 border-none w-48 transition-all" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/20 text-slate-400 text-[8px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3">Mission</th>
                    <th className="px-5 py-3">Méthode</th>
                    <th className="px-5 py-3">Proprio</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Montant</th>
                    <th className="px-5 py-3 text-center">Gérer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-[10px] text-slate-900 dark:text-white truncate max-w-[180px]">{t.projectName || t.category}</span>
                          <span className="text-[8px] text-slate-400 font-bold tabular-nums tracking-tighter uppercase">{t.date}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {t.method || 'STANDARD'}
                        </span>
                      </td>
                      <td className="px-5 py-3"><span className="text-[9px] font-black uppercase text-indigo-500 dark:text-indigo-400">{t.owner}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                           <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${t.isSold ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {t.isSold ? 'CLOS' : 'OUVERT'}
                          </span>
                          {t.isSold && (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && (
                            <button 
                              onClick={() => handleRevertSale(t.id)} 
                              title="Annuler l'encaissement"
                              className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125"
                            >
                              ↩️
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-right font-black tabular-nums text-[11px] ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.amount.toLocaleString()}€
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all opacity-40 group-hover:opacity-100">✏️</button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-rose-500">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
