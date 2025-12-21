
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
          message: "Database incomplete: column 'method' missing.",
          sql: err.sql
        });
      } else {
        setDbError({ message: err.message || "Sync Error" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette opération ?')) {
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
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[9px] uppercase tracking-widest italic">
      Chargement du Vault...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24 relative overflow-hidden">
        <div className="max-w-sm w-full bg-white/5 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10 text-center">
           <div className="mb-8">
             <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
               MILLIONAIRE<br/>
               <span className="text-indigo-500 not-italic">EN 2027</span>
             </h1>
             <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-3 italic">Vault Security</p>
           </div>

           {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); }
            }} className="space-y-3">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] outline-none" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Anon Key" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] outline-none" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-transform active:scale-95">Lier Database</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              try {
                const { data, error } = await DB.signIn(email, password);
                if (error) setErrorMsg("Accès refusé"); else if (data?.user) setUser(data.user);
              } catch (err) { setErrorMsg("Erreur réseau"); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-4 text-left">
              <div className="space-y-3">
                <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mot de passe" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] outline-none focus:ring-1 focus:ring-indigo-500" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {errorMsg && <p className="text-rose-500 text-[8px] font-black uppercase text-center tracking-widest">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">
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
        <div className="space-y-8">
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
                   owner: tx.owner, note: `Profit: ${tx.projectName || 'Stock'}`, isSold: true,
                   method: tx.method
                 });
                 await loadTransactions();
               } catch (e: any) { loadTransactions(); }
            }} 
          />

          {/* Transaction Table (Higher density) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400">Journal des flux</h4>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700 w-40 md:w-56" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[8px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800"><th className="px-5 py-3">Mission</th><th className="px-5 py-3">Stratégie</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3 text-right">Montant</th><th className="px-5 py-3 text-center">Gérer</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 group transition-all">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-[10px] ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}`}>{t.type === TransactionType.INCOME ? '↑' : '↓'}</div>
                          <div>
                            <p className="font-black uppercase text-[10px] text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{t.projectName || t.category}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{t.date} • {t.owner}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        {t.method && t.method !== 'Standard' ? <span className="text-[8px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded tracking-widest">{t.method}</span> : <span className="text-[8px] opacity-20 italic">Base</span>}
                      </td>
                      <td className="px-5 py-2.5"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.isSold ? 'text-emerald-500 bg-emerald-50/50' : 'text-amber-500 bg-amber-50/50'}`}>{t.isSold ? 'CLOS' : 'OUVERT'}</span></td>
                      <td className={`px-5 py-2.5 text-right font-black tabular-nums text-xs ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()}€</td>
                      <td className="px-5 py-2.5">
                        <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-900 hover:text-white transition-all scale-90"><Icons.Pencil /></button>
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
