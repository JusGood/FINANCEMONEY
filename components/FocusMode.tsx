
import React, { useState, useEffect } from 'react';
import { Note, Owner } from '../types';
import * as DB from '../services/db';
import { Icons } from '../constants';

interface CountdownProps {
  deadline: string;
}

const Countdown: React.FC<CountdownProps> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return (
    <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-[9px] font-black animate-pulse uppercase tracking-tighter">
      ÉCHÉANCE PASSÉE ⚠️
    </div>
  );

  const isUrgent = timeLeft.d === 0 && timeLeft.h < 12;

  return (
    <div className={`flex gap-2 items-center font-black tabular-nums transition-colors duration-500 ${isUrgent ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
      <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></div>
      <div className="flex items-baseline gap-1">
        {timeLeft.d > 0 && <span className="text-sm">{timeLeft.d}<span className="text-[8px] opacity-40 ml-0.5 font-bold">J</span></span>}
        <span className="text-sm">{timeLeft.h}<span className="text-[8px] opacity-40 ml-0.5 font-bold">H</span></span>
        <span className="text-sm">{timeLeft.m}<span className="text-[8px] opacity-40 ml-0.5 font-bold">M</span></span>
      </div>
    </div>
  );
};

export const FocusMode: React.FC<{ owner: Owner }> = ({ owner }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({
    text: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    owner: owner === Owner.GLOBAL ? Owner.LARBI : owner,
    priority: 'Urgent' as any
  });

  const load = async () => {
    const data = await DB.getNotes();
    setNotes(owner === Owner.GLOBAL ? data : data.filter(n => n.owner === owner));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const sub = DB.subscribeToChanges('notes', load);
    return () => { DB.getSupabase()?.removeChannel(sub!); };
  }, [owner]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.text || !newNote.date) return;
    
    const finalDeadline = newNote.time 
      ? `${newNote.date}T${newNote.time}:00`
      : `${newNote.date}T23:59:59`;

    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote.text,
      deadline: finalDeadline,
      isCompleted: false,
      owner: newNote.owner,
      priority: newNote.priority
    };
    
    await DB.saveNote(note);
    setNewNote({ ...newNote, text: '', time: '' });
    setShowAdd(false);
    load();
  };

  const toggleComplete = async (note: Note) => {
    await DB.updateNoteDB(note.id, { isCompleted: !note.isCompleted });
    load();
  };

  const deleteNote = async (id: string) => {
    if (confirm('Supprimer cet objectif ?')) {
      await DB.deleteNoteDB(id);
      load();
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl transition-colors">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Focus Mode</h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-3">Discipline & Exécution</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`mt-6 md:mt-0 px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all duration-300 shadow-xl ${
            showAdd ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none' : 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95'
          }`}
        >
          {showAdd ? 'Annuler' : 'Fixer un Objectif'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[4rem] border-2 border-indigo-50 dark:border-slate-800 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300 transition-colors">
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-6 tracking-widest">Quelle est la mission ?</label>
             <textarea 
               placeholder="Ex: Finaliser le FTID Apple et valider le paiement DNA..."
               className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[3rem] p-10 font-bold text-xl outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 transition-all min-h-[140px] placeholder:opacity-10 border-none"
               value={newNote.text}
               onChange={e => setNewNote({...newNote, text: e.target.value})}
               required
             />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-6">Date Limite</label>
               <input 
                 type="date" 
                 className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-6 rounded-2xl font-black text-xs uppercase border-none outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
                 value={newNote.date}
                 onChange={e => setNewNote({...newNote, date: e.target.value})}
                 required
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-6">Heure (Optionnel)</label>
               <input 
                 type="time" 
                 className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-6 rounded-2xl font-black text-xs border-none outline-none focus:bg-white dark:focus:bg-slate-700 transition-all"
                 value={newNote.time}
                 onChange={e => setNewNote({...newNote, time: e.target.value})}
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-6">Responsable</label>
               <select 
                 className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white p-6 rounded-2xl font-black text-xs uppercase appearance-none cursor-pointer border-none outline-none"
                 value={newNote.owner}
                 onChange={e => setNewNote({...newNote, owner: e.target.value as any})}
               >
                 <option value={Owner.LARBI}>Larbi</option>
                 <option value={Owner.YASSINE}>Yassine</option>
               </select>
            </div>
            <div className="pt-6">
              <button type="submit" className="w-full h-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95">Lancer le Chrono</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {notes.filter(n => !n.isCompleted).map(note => (
          <div key={note.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none group relative overflow-hidden flex flex-col justify-between h-72 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${note.owner === Owner.LARBI ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                  {note.owner}
                </span>
                <Countdown deadline={note.deadline} />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter line-clamp-3">{note.text}</p>
            </div>

            <div className="relative z-10 flex gap-4 mt-8">
              <button 
                onClick={() => toggleComplete(note)}
                className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
              >
                TERMINÉ ✅
              </button>
              <button 
                onClick={() => deleteNote(note.id)}
                className="w-16 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 transition-all"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
        
        {/* Terminés discret */}
        <div className="col-span-full mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.filter(n => n.isCompleted).map(note => (
            <div key={note.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 opacity-40 flex justify-between items-center group transition-all hover:opacity-100">
               <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs">✓</div>
                 <div className="max-w-[200px]">
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 line-through uppercase tracking-tighter truncate">{note.text}</p>
                   <p className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase">Validé par {note.owner}</p>
                 </div>
               </div>
               <button onClick={() => deleteNote(note.id)} className="text-slate-200 dark:text-slate-700 hover:text-rose-500 p-2 transition-colors"><Icons.Trash /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
