
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
        const { data: { session } } = await sb.auth.getSession();
        if (session) setUser(session.user);
        
        sb.auth.onAuthStateChange((_event: string, session: any) => {
          setUser(session?.user || null);
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    const data = await DB.getTransactions();
    setTransactions(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (authMode === 'signup') {
      if (inviteCode.toUpperCase() !== SECRET_INVITE) {
        setErrorMsg("Code d'invitation invalide.");
        return;
      }
      const { data, error } = await DB.signUp(email, password, name);
      if (error) setErrorMsg(error.message);
      else alert("Vérifie tes emails pour confirmer l'inscription !");
    } else {
      const { data, error } = await DB.signIn(email, password);
      if (error) setErrorMsg("Email ou mot de passe incorrect.");
    }
  };

  const saveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('supabase_url', dbConfig.url);
    localStorage.setItem('supabase_key', dbConfig.key);
    if (DB.initDB()) setAuthMode('login');
    else setErrorMsg("Configuration invalide.");
  };

  const handleLogout = async () => {
    await DB.signOut();
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse">CHARGEMENT DU VAULT...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden text-slate-900">
        <div className="absolute top-0 left-0 w-full h-full">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">FinanceFlow</h1>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest animate-pulse">MILLIONAIRE EN 2027</p>
          </div>

          {authMode === 'config' ? (
            <form onSubmit={saveConfig} className="space-y-4">
              <h2 className="text-white text-center font-bold mb-6">Configuration Initiale (Cloud)</h2>
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé API Anon" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-xs">Activer le Cloud</button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex bg-white/10 p-1 rounded-2xl mb-6">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${authMode === 'login' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Connexion</button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${authMode === 'signup' ? 'bg-white text-slate-950' : 'text-white/50'}`}>Inscription</button>
              </div>

              {authMode === 'signup' && (
                <>
                  <input type="text" placeholder="Ton Prénom" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={name} onChange={e => setName(e.target.value)} required />
                  <input type="text" placeholder="Code Secret (Invite)" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none border-indigo-500/50" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                </>
              )}
              
              <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
              
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{errorMsg}</p>}

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-600/20 transition-all">
                {authMode === 'login' ? 'Entrer dans le Vault' : 'Créer mon compte'}
              </button>
            </form>
          )}
          
          <button onClick={() => setAuthMode(authMode === 'config' ? 'login' : 'config')} className="w-full mt-6 text-[9px] font-black text-white/20 uppercase hover:text-white/50 transition-colors">
            {authMode === 'config' ? "Retour à la connexion" : "Modifier configuration Cloud"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
            {user.user_metadata?.display_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecté en tant que</p>
            <p className="text-lg font-black text-slate-900">{user.user_metadata?.display_name || user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="px-6 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Déconnexion</button>
      </div>

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
          
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden p-2">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
               <h4 className="text-2xl font-black tracking-tight italic">Journal des Flux</h4>
               <input type="text" placeholder="Rechercher..." className="bg-slate-50 rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest"><th className="px-10 py-8">Date</th><th className="px-10 py-8">Qui</th><th className="px-10 py-8">Projet</th><th className="px-10 py-8 text-right">Montant</th><th className="px-10 py-8 text-center">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()))).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-7 text-xs font-black text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-10 py-7"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${t.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>{t.owner}</span></td>
                    <td className="px-10 py-7 font-black text-slate-900">{t.projectName || t.category}</td>
                    <td className={`px-10 py-7 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()} €</td>
                    <td className="px-10 py-7 flex justify-center gap-2">
                      <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Icons.Pencil /></button>
                      <button onClick={async () => { if(confirm('Supprimer ?')) { await DB.deleteTransactionDB(t.id); loadTransactions(); } }} className="p-3 bg-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Icons.Trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
