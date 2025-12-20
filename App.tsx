
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
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        const { error } = await DB.signUp(email, password, name);
        if (error) setErrorMsg(error.message);
        else { alert("Compte créé !"); setAuthMode('login'); }
      } else {
        const { data, error } = await DB.signIn(email, password);
        if (error) setErrorMsg("Email ou mot de passe incorrect.");
        else if (data?.user) setUser(data.user);
      }
    } catch (err) { setErrorMsg("Serveur injoignable."); }
    finally { setIsAuthenticating(false); }
  };

  const saveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('supabase_url', dbConfig.url.trim());
    localStorage.setItem('supabase_key', dbConfig.key.trim());
    if (DB.initDB()) { setAuthMode('login'); setErrorMsg(''); }
    else setErrorMsg("Configuration invalide.");
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse uppercase tracking-widest text-xs">Initialisation...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">FinanceFlow</h1>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Synchro Larbi & Yassine</p>
          </div>

          {authMode === 'config' ? (
            <form onSubmit={saveConfig} className="space-y-4">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé API" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs">Valider les Clés</button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${authMode === 'login' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Connexion</button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${authMode === 'signup' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Inscription</button>
              </div>
              {authMode === 'signup' && (
                <>
                  <input type="text" placeholder="Prénom" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={name} onChange={e => setName(e.target.value)} required />
                  <input type="text" placeholder="Code (FM33)" className="w-full bg-white/10 border border-indigo-500/30 rounded-2xl p-4 text-white outline-none text-sm uppercase" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                </>
              )}
              <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs">
                {isAuthenticating ? 'Connexion...' : 'Entrer dans le Vault'}
              </button>
            </form>
          )}
          <button onClick={() => setAuthMode(authMode === 'config' ? 'login' : 'config')} className="w-full mt-6 text-[9px] font-black text-white/30 uppercase tracking-widest">
            {authMode === 'config' ? "Retour" : "Réglages Réseau"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg uppercase">{user.user_metadata?.display_name?.charAt(0) || user.email?.charAt(0)}</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecté sur <span className="text-indigo-600 font-black">{DB.getProjectId()}</span></p>
            <p className="text-lg font-black text-slate-900">{user.user_metadata?.display_name || user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadTransactions} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest">🔄 Synchro</button>
          <button onClick={() => DB.signOut().then(() => setUser(null))} className="px-8 py-4 bg-slate-100 text-[10px] font-black uppercase tracking-widest rounded-2xl">Quitter</button>
        </div>
      </div>

      {dbError && (
        <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 animate-bounce">
          <div className="text-2xl">🚨</div>
          <div>
            <p className="text-rose-900 font-black text-sm uppercase italic">Désynchronisation détectée</p>
            <p className="text-rose-600 text-xs font-bold">Erreur : {dbError}. (Vérifiez le RLS sur Supabase)</p>
          </div>
        </div>
      )}

      {activeView === 'Add' ? (
        <TransactionForm onAdd={async (d) => {
          const tx = {...d, id: Math.random().toString(36).substr(2, 9)};
          try {
            await DB.saveTransaction(tx);
            await loadTransactions();
            setActiveView(d.owner);
          } catch(e: any) { alert("Erreur : " + e.message); }
        }} onUpdate={async (id, d) => {
          try {
            await DB.updateTransactionDB(id, d);
            await loadTransactions();
            setEditingTransaction(null);
            setActiveView(d.owner);
          } catch(e: any) { alert("Erreur : " + e.message); }
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
               <h4 className="text-2xl font-black italic">Journal Cloud Partagé</h4>
               <input type="text" placeholder="Rechercher..." className="bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none w-80" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                      <td className={`px-10 py-8 text-right font-black text-lg ${t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()} €</td>
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
