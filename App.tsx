
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import { Icons } from './constants';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'config'>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [dbError, setDbError] = useState<{message: string, sql?: string} | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        setAuthMode('config');
      } else {
        const sb = DB.getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) setUser(session.user);
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
      if (err.message === "MISSING_COLUMN_METHOD") {
        setDbError({
          message: "Database schema incomplete: column 'method' is missing.",
          sql: err.sql
        });
      } else {
        setDbError({ message: err.message || "Sync Error" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer définitivement du Vault ?')) {
      try {
        await DB.deleteTransactionDB(id);
        await loadTransactions();
        setEditingTransaction(null);
        setActiveView(Owner.GLOBAL);
      } catch (e: any) {
        setDbError({ message: e.message });
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[10px] uppercase tracking-widest italic">
      Chargement du Vault...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24 relative overflow-hidden">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-10 rounded-[2rem] border border-white/10 shadow-2xl relative z-10 text-center">
           <div className="mb-10">
             <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
               MILLIONAIRE<br/>
               <span className="text-indigo-500 not-italic">EN 2027</span>
             </h1>
             <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-4">Auth Required</p>
           </div>

           {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); }
            }} className="space-y-3">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:bg-white/10" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Anon Key" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:bg-white/10" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Connect DB</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              try {
                const { data, error } = await DB.signIn(email, password);
                if (error) setErrorMsg("Clés invalides"); else if (data?.user) setUser(data.user);
              } catch (err) { setErrorMsg("Erreur réseau"); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-4 text-left">
              <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Pass" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={password} onChange={e => setPassword(e.target.value)} required />
              {errorMsg && <p className="text-rose-500 text-[8px] font-black uppercase text-center">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-5 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">
                {isAuthenticating ? 'Vérification...' : 'Déverrouiller'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {dbError && (
        <div className="bg-white dark:bg-slate-900 border border-rose-500/30 p-4 rounded-xl mb-8 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-xl">⚠️</span>
            <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{dbError.message}</div>
          </div>
          {dbError.sql && <button onClick={() => {navigator.clipboard.writeText(dbError.sql!); alert("SQL Copied");}} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Copy Fix SQL</button>}
        </div>
      )}

      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            try { await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)}); await loadTransactions(); setActiveView(d.owner); } 
            catch(e: any) { loadTransactions(); }
          }} 
          onUpdate={async (id, d) => {
            try { await DB.updateTransactionDB(id, d); await loadTransactions(); setEditingTransaction(null); setActiveView(d.owner); } 
            catch(e: any) { loadTransactions(); }
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="space-y-12">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               try {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
                 await DB.saveTransaction({
                   id: Math.random().toString(36).substr(2, 9),
                   date: new Date().toISOString().split('T')[0],
                   amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                   category: tx.category, type: TransactionType.INCOME, account: tx.account,
                   owner: tx.owner, note: `Profit: ${tx.projectName || 'Sans nom'}`, isSold: true,
                   method: tx.method
                 });
                 await loadTransactions();
               } catch (e: any) { loadTransactions(); }
            }} 
          />

          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20">
              <h4 className="font-black uppercase text-[11px] tracking-widest text-slate-900 dark:text-white">Audit des Flux</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="bg-white dark:bg-slate-800 rounded-lg px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700 w-48 md:w-64" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800"><th className="px-6 py-4">Opération</th><th className="px-6 py-4">Propriétaire</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Montant</th><th className="px-6 py-4 text-center">Gérer</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 group transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}`}>{t.type === TransactionType.INCOME ? '↑' : '↓'}</div>
                          <div>
                            <p className="font-black uppercase text-[11px] text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{t.projectName || t.category}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{t.date} {t.method !== 'Standard' && <span className="ml-2 text-indigo-500">• {t.method}</span>}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${t.owner === Owner.LARBI ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600'}`}>{t.owner}</span></td>
                      <td className="px-6 py-4"><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${t.isSold ? 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-amber-500 bg-amber-50/50 dark:bg-amber-900/10'}`}>{t.isSold ? 'CLOS' : 'OUVERT'}</span></td>
                      <td className={`px-6 py-4 text-right font-black tabular-nums text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()}€</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-900 hover:text-white transition-all"><Icons.Pencil /></button>
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
