import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { Icons } from './constants';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'config'>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeView, setActiveView] = useState<Owner | 'Add'>(Owner.GLOBAL);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });

  const SQL_SETUP = `-- Script pour Larbi & Yassine
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  "productPrice" NUMERIC,
  "feePercentage" NUMERIC,
  "expectedProfit" NUMERIC,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  account TEXT NOT NULL,
  owner TEXT NOT NULL,
  note TEXT,
  "projectName" TEXT,
  "clientName" TEXT,
  "isForecast" BOOLEAN DEFAULT FALSE,
  "isSold" BOOLEAN DEFAULT FALSE
);
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`;

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
      const channel = DB.subscribeToChanges(() => loadTransactions());
      return () => { if (channel) DB.getSupabase()?.removeChannel(channel); };
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const data = await DB.getTransactions();
      setTransactions(data);
      setDbError(null);
    } catch (err: any) {
      setDbError(err.message || "Erreur de synchronisation");
    }
  };

  const isTableError = dbError?.toLowerCase().includes('relation "transactions" does not exist') || 
                      dbError?.toLowerCase().includes('schema cache') || 
                      dbError?.toLowerCase().includes('could not find the table');

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[10px] uppercase tracking-widest">FinanceFlow...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">FinanceFlow</h1>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em]">Synchro Larbi & Yassine</p>
          </div>

          {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); setErrorMsg(''); }
            }} className="space-y-4">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé API Anon" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-indigo-50 transition-all">Connecter</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setErrorMsg('');
              setIsAuthenticating(true);
              try {
                if (authMode === 'signup') {
                  const { error } = await DB.signUp(email, password, name);
                  if (error) setErrorMsg(error.message);
                  else { alert("Compte créé !"); setAuthMode('login'); }
                } else {
                  const { data, error } = await DB.signIn(email, password);
                  if (error) setErrorMsg("Identifiants incorrects.");
                  else if (data?.user) setUser(data.user);
                }
              } catch (err) { setErrorMsg("Erreur réseau."); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${authMode === 'login' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Connexion</button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${authMode === 'signup' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Inscription</button>
              </div>
              {authMode === 'signup' && <input type="text" placeholder="Prénom" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={name} onChange={e => setName(e.target.value)} required />}
              <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">
                {isAuthenticating ? 'Vérification...' : 'Ouvrir le Vault'}
              </button>
            </form>
          )}
          <button onClick={() => setAuthMode(authMode === 'config' ? 'login' : 'config')} className="w-full mt-6 text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
            {authMode === 'config' ? "Retour" : "Réglages Cloud"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {/* Welcome Card - Dynamic */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-10 bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg uppercase shrink-0 ${activeView === Owner.YASSINE ? 'bg-purple-600' : 'bg-indigo-600'}`}>
            {user.user_metadata?.display_name?.charAt(0) || user.email?.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connecté à <span className="text-indigo-600">{DB.getProjectId()}</span></p>
            <p className="text-base md:text-lg font-black text-slate-900 truncate">{user.user_metadata?.display_name || user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <button onClick={loadTransactions} className="flex-1 md:flex-none p-3 md:p-4 bg-slate-50 text-slate-500 rounded-xl md:rounded-2xl hover:bg-slate-100 text-[9px] font-black uppercase transition-all">Sync</button>
          <button onClick={() => DB.signOut().then(() => setUser(null))} className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-slate-100 text-[9px] font-black uppercase rounded-xl md:rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all">Logout</button>
        </div>
      </div>

      {isTableError ? (
        <div className="mb-10 p-6 md:p-10 bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] md:rounded-[3rem]">
          <h3 className="text-xl md:text-2xl font-black text-rose-900 uppercase mb-4">Initialisation SQL</h3>
          <p className="text-rose-700 font-bold mb-6 text-xs md:text-sm">Copiez ce code dans SQL Editor de Supabase :</p>
          <div className="bg-slate-900 p-4 rounded-xl relative overflow-hidden">
            <pre className="text-indigo-300 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">{SQL_SETUP}</pre>
          </div>
        </div>
      ) : dbError && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
          <span className="text-lg">🚨</span>
          <div className="text-rose-600 text-[9px] font-bold uppercase">{dbError}</div>
        </div>
      )}

      {!isTableError && (
        activeView === 'Add' ? (
          <TransactionForm 
            onAdd={async (d) => {
              const tx = {...d, id: Math.random().toString(36).substr(2, 9)};
              try { await DB.saveTransaction(tx); await loadTransactions(); setActiveView(d.owner); } 
              catch(e: any) { setDbError(e.message); }
            }} 
            onUpdate={async (id, d) => {
              try { await DB.updateTransactionDB(id, d); await loadTransactions(); setEditingTransaction(null); setActiveView(d.owner); } 
              catch(e: any) { setDbError(e.message); }
            }} 
            initialData={editingTransaction} 
            onCancel={() => setActiveView(Owner.GLOBAL)} 
          />
        ) : (
          <div className="space-y-10 md:space-y-12 pb-24 md:pb-0">
            <Dashboard 
              transactions={transactions} 
              ownerFilter={activeView as Owner} 
              onConfirmSale={async (id) => {
                 const tx = transactions.find(t => t.id === id);
                 if (!tx) return;
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
                 const incomeTx: Transaction = {
                   id: Math.random().toString(36).substr(2, 9),
                   date: new Date().toISOString().split('T')[0],
                   amount: tx.amount + (tx.expectedProfit || 0),
                   category: tx.category, type: TransactionType.INCOME, account: tx.account,
                   owner: tx.owner, note: `Vente : ${tx.projectName}`, isSold: true
                 };
                 await DB.saveTransaction(incomeTx);
                 await loadTransactions();
              }} 
            />
            
            <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-50">
                 <h4 className="text-lg md:text-2xl font-black italic uppercase tracking-tighter">Journal de Flux</h4>
                 <div className="relative w-full md:w-80 group">
                   <input 
                     type="text" 
                     placeholder="Projet..." 
                     className="w-full bg-slate-50 rounded-xl md:rounded-2xl px-5 py-3 md:py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 pl-10" 
                     value={searchTerm} 
                     onChange={e => setSearchTerm(e.target.value)} 
                   />
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</div>
                 </div>
              </div>

              {/* Transaction List - Adaptive View */}
              <div className="md:hidden space-y-px bg-slate-100">
                {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category).toLowerCase().includes(searchTerm.toLowerCase()))).map(t => (
                  <div key={t.id} className="bg-white p-5 flex items-center justify-between active:bg-slate-50 transition-colors" onClick={() => {setEditingTransaction(t); setActiveView('Add');}}>
                    <div className="flex gap-4 items-center min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '📈' : '💸'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">{t.projectName || t.category}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.date).toLocaleDateString()} • {t.owner}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-black ${t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.amount.toLocaleString()}€
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <div className="p-20 text-center bg-white text-slate-300 text-[10px] font-black uppercase">Vide</div>}
              </div>

              {/* Transaction List - Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest"><th className="px-10 py-8">Date</th><th className="px-10 py-8">Qui</th><th className="px-10 py-8">Projet</th><th className="px-10 py-8 text-right">Montant</th><th className="px-10 py-8 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category).toLowerCase().includes(searchTerm.toLowerCase()))).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-8 text-xs font-black text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-10 py-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${t.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>{t.owner}</span></td>
                        <td className="px-10 py-8 font-black text-slate-900">{t.projectName || t.category}</td>
                        <td className={`px-10 py-8 text-right font-black text-lg ${t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()} €</td>
                        <td className="px-10 py-8 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Icons.Pencil /></button>
                          <button onClick={async (e) => { e.stopPropagation(); if(confirm('Supprimer ?')) { await DB.deleteTransactionDB(t.id); loadTransactions(); } }} className="p-3 bg-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Icons.Trash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </Layout>
  );
};

export default App;