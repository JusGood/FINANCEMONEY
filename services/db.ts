
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Note } from '../types';

let supabase: SupabaseClient | null = null;

export const initDB = () => {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');
  if (url && key) {
    try {
      supabase = createClient(url, key);
      return true;
    } catch (e) {
      console.error("Erreur d'initialisation Supabase:", e);
      return false;
    }
  }
  return false;
};

export const getSupabase = () => supabase;

export const getProjectId = () => {
  const url = localStorage.getItem('supabase_url');
  if (!url) return 'Non connecté';
  return url.split('//')[1]?.split('.')[0] || 'Inconnu';
};

export const signIn = async (email: string, pass: string) => {
  if (!supabase) return { error: { message: "Base de données non configurée." } };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  return { data, error };
};

export const signOut = async () => {
  if (supabase) await supabase.auth.signOut();
};

// --- TRANSACTIONS ---
export const getTransactions = async (): Promise<Transaction[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveTransaction = async (tx: Transaction) => {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').insert([tx]);
  if (error) throw new Error(error.message);
};

export const updateTransactionDB = async (id: string, tx: Transaction) => {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').update(tx).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteTransactionDB = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- NOTES / FOCUS ---
export const getNotes = async (): Promise<Note[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('notes').select('*').order('deadline', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveNote = async (note: Note) => {
  if (!supabase) return;
  const { error } = await supabase.from('notes').insert([note]);
  if (error) throw new Error(error.message);
};

export const updateNoteDB = async (id: string, note: Partial<Note>) => {
  if (!supabase) return;
  const { error } = await supabase.from('notes').update(note).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteNoteDB = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  if (!supabase) return null;
  return supabase
    .channel(`realtime-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};
