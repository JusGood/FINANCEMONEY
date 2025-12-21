
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
    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black animate-pulse uppercase tracking-tighter">
      Deadline Dépassée ⚠️
    </div>
  );

  const isUrgent = timeLeft.d === 0 && timeLeft.h < 24;

  return (
    <div className={`flex gap-1.5 items-center font-black tabular-nums transition-colors duration-500 ${isUrgent ? 'text-rose-500' : 'text-slate-900'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></div>
      <div className="flex items-baseline gap-0.5">
        {timeLeft.d > 0 && <span className="text-sm">{timeLeft.d}<span className="text-[8px] opacity-40 ml-0.5">J</span></span>}
        <span className="text-sm">{timeLeft.h}<span className="text-[8px] opacity-40 ml-0.5">H</span></span>
        <span className="text-sm">{timeLeft.m}<span className="text-[8px] opacity-40 ml-0.5">M</span></span>
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
    time: '', // Heure facultative
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
    
    // Si l'heure n'est pas saisie, on met la fin de journée par défaut
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">Focus Mode</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Productivité & Concentration</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`mt-4 md:mt-0 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 shadow-lg ${
            showAdd ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white shadow-indigo-200 hover:scale-105 active:scale-95'
          }`}
        >
          {showAdd ? 'Annuler' : 'Ajouter un Objectif'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 md:p-12 rounded-[3.5rem] border-2 border-indigo-50 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Quelle est la mission ?</label>
             <textarea 
               placeholder="Ex: Envoyer le stock FTID et vérifier les paiements..."
               className="w-full bg-slate-50 rounded-[2rem] p-8 font-bold text-lg outline-none focus:ring-4 focus:ring-indigo-50 transition-all min-h-[120px] placeholder:opacity-30"
               value={newNote.text}
               onChange={e => setNewNote({...newNote, text: e.target.value})}
               required
             />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Date</label>
               <input 
                 type="date" 
                 className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase"
                 value={newNote.date}
                 onChange={e => setNewNote({...newNote, date: e.target.value})}
                 required
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Heure (Optionnel)</label>
               <input 
                 type="time" 
                 className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs"
                 value={newNote.time}
                 onChange={e => setNewNote({...newNote, time: e.target.value})}
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Propriétaire</label>
               <select 
                 className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase appearance-none cursor-pointer"
                 value={newNote.owner}
                 onChange={e => setNewNote({...newNote, owner: e.target.value as any})}
               >
                 <option value={Owner.LARBI}>Larbi</option>
                 <option value={Owner.YASSINE}>Yassine</option>
               </select>
            </div>
            <div className="pt-6">
              <button type="submit" className="w-full h-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">Lancer le compte à rebours</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {notes.filter(n => !n.isCompleted).map(note => (
          <div key={note.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 group relative overflow-hidden flex flex-col justify-between h-64 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-100 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${note.owner === Owner.LARBI ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                  {note.owner}
                </span>
                <Countdown deadline={note.deadline} />
              </div>
              <p className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter line-clamp-3">{note.text}</p>
            </div>

            <div className="relative z-10 flex gap-3 mt-8">
              <button 
                onClick={() => toggleComplete(note)}
                className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100"
              >
                Terminé ✅
              </button>
              <button 
                onClick={() => deleteNote(note.id)}
                className="w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 active:scale-90 transition-all border border-transparent hover:border-rose-100"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
        
        {/* Terminés discret */}
        {notes.filter(n => n.isCompleted).map(note => (
          <div key={note.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200/50 opacity-40 flex justify-between items-center group transition-all hover:opacity-100">
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 line-through uppercase tracking-tighter truncate w-32 md:w-48">{note.text}</p>
                 <p className="text-[8px] font-bold text-slate-300 uppercase">Fini pour {note.owner}</p>
               </div>
             </div>
             <button onClick={() => deleteNote(note.id)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors"><Icons.Trash /></button>
          </div>
        ))}

        {notes.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
             <div className="text-6xl mb-6">🏆</div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Libre comme l'air</h3>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Aucun objectif en attente, profitez-en pour ré-investir.</p>
          </div>
        )}
      </div>
    </div>
  );
};
