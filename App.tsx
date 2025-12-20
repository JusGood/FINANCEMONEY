
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
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // App states
  const [activeView, setActiveView] = useState<Owner | 'Add'>(Owner.GLOBAL);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });

  const SECRET_INVITE = "FM33";

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        setAuthMode('config');
      } else {
        const sb = DB.getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          }
          
          // Ecouteur de session
          sb.auth.onAuthStateChange((event: string, session: any) => {
            if (session?.user) setUser(session.user);
            else if (event === 'SIGNED_OUT') setUser(null);
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
      const channel = DB.subscribeToChanges(() => {
        loadTransactions();
      });
      return () => {
        if (channel) DB.getSupabase()?.removeChannel(channel);
      };
    }
  }, [user]);

  const loadTransactions = async () => {
    setDbError(null);
    try {
      const data = await DB.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setDbError("Erreur d'accès aux données. Vérifiez si la table 'transactions' existe sur Supabase.");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsAuthenticating(true);
    
    try {
      if (authMode === 'signup') {
        if (inviteCode.toUpperCase() !== SECRET_INVITE) {
          setErrorMsg("Code d'invitation secret incorrect.");
          setIsAuthenticating(false);
          return;
        }
        const { data, error } = await DB.signUp(email, password, name);
        if (error) {
          setErrorMsg(error.message);
        } else {
          alert("Compte créé ! Tu peux maintenant te connecter. (Vérifie tes emails si la confirmation est activée)");
          setAuthMode('login');
        }
      } else {
        const { data, error } = await DB.signIn(email, password);
        if (error) {
          setErrorMsg(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
        } else if (data?.user) {
          // Connexion réussie : On force l'UI à changer tout de suite
          setUser(data.user);
        }
      }
    } catch (err) {
      setErrorMsg("Impossible de joindre le serveur.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const saveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = dbConfig.url.trim();
    const cleanKey = dbConfig.key.trim();

    if (!cleanUrl.startsWith('https://')) {
      setErrorMsg("L'URL doit commencer par https://");
      return;
    }
    
    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_key', cleanKey);
    
    if (DB.initDB()) {
      setAuthMode('login');
      setErrorMsg('');
    } else {
      setErrorMsg("Configuration invalide.");
    }
  };

  const handleLogout = async () => {
    await DB.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Vault FinanceFlow</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">FinanceFlow</h1>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Accès restreint • 2027</p>
          </div>

          {authMode === 'config' ? (
            <form onSubmit={saveConfig} className="space-y-4">
              <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 mb-6">
                <p className="text-indigo-200 text-[11px] font-bold leading-relaxed">
                  Collez vos clés Supabase pour synchroniser Larbi & Yassine.
                </p>
              </div>
              <input type="text" placeholder="Project URL" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 ring-indigo-500/50 text-sm" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Anon Public Key" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 ring-indigo-500/50 text-sm" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{errorMsg}</p>}
              <button type="submit" className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs hover:scale-[1.02] transition-all">Connecter le Cloud</button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'login' ? 'bg-white text-slate-950 shadow-lg' : 'text-white/50'}`}>Connexion</button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'signup' ? 'bg-white text-slate-950 shadow-lg' : 'text-white/50'}`}>Inscription</button>
              </div>

              {authMode === 'signup' && (
                <>
                  <input type="text" placeholder="Prénom" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={name} onChange={e => setName(e.target.value)} required />
                  <input type="text" placeholder="Code Invitation (FM33)" className="w-full bg-white/10 border border-indigo-500/30 rounded-2xl p-4 text-white outline-none uppercase font-black text-sm" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                </>
              )}
              
              <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
              
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  <p className="text-rose-400 text-[10px] font-black uppercase text-center leading-tight">{errorMsg}</p>
                </div>
              )}

              <button type="submit" disabled={isAuthenticating} className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 ${isAuthenticating ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02]'}`}>
                {isAuthenticating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {authMode === 'login' ? 'Entrer dans le Vault' : 'Créer mon compte'}
              </button>
            </form>
          )}
          
          <div className="mt-8 flex flex-col items-center gap-4">
            <button onClick={() => setAuthMode(authMode === 'config' ? 'login' : 'config')} className="text-[9px] font-black text-white/30 uppercase hover:text-white/60 transition-colors tracking-widest">
              {authMode === 'config' ? "Retour" : "Paramètres Base de données"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl uppercase">
            {user.user_metadata?.display_name?.charAt(0) || user.email?.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecté</p>
            <p className="text-lg font-black text-slate-900">{user.user_metadata?.display_name || user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadTransactions} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all text-[10px] font-black uppercase tracking-widest">🔄 Actualiser</button>
          <button onClick={handleLogout} className="px-8 py-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Quitter</button>
        </div>
      </div>

      {dbError && (
        <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="text-rose-900 font-black text-sm uppercase">Problème Database</p>
            <p className="text-rose-600 text-xs font-bold">{dbError}</p>
          </div>
        </div>
      )}

      {activeView === 'Add' ? (
        <TransactionForm onAdd={async (d) => {
          const tx = {...d, id: Math.random().toString(36).substr(2, 9)};
          await DB.saveTransaction(tx);
          await loadTransactions();
          setActiveView(d.owner);
        }} onUpdate={async (id, d) => {
          await DB.updateTransactionDB(id, d);
          await loadTransactions();
          setEditingTransaction(null);
          setActiveView(d.owner);
        }} initialData={editingTransaction} onCancel={() => setActiveView(Owner.GLOBAL)} />
      ) : (
        <div className="space-y-12">
          <Dashboard transactions={transactions} ownerFilter={activeView as Owner} onConfirmSale={async (id) => {
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
          }} />
          
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50">
               <h4 className="text-2xl font-black italic">Journal des Flux</h4>
               <input type="text" placeholder="Rechercher..." className="bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none w-full md:w-80" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest"><th className="px-10 py-8">Date</th><th className="px-10 py-8">Propriétaire</th><th className="px-10 py-8">Projet</th><th className="px-10 py-8 text-right">Montant</th><th className="px-10 py-8 text-center">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()))).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-8 text-xs font-black text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-10 py-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${t.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>{t.owner}</span></td>
                      <td className="px-10 py-8 font-black text-slate-900">{t.projectName || t.category}</td>
                      <td className={`px-10 py-8 text-right font-black text-lg ${t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.amount.toLocaleString()} €
                      </td>
                      <td className="px-10 py-8 flex justify-center gap-2">
                        <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Icons.Pencil /></button>
                        <button onClick={async () => { if(confirm('Supprimer ?')) { await DB.deleteTransactionDB(t.id); loadTransactions(); } }} className="p-3 bg-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Icons.Trash /></button>
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
