
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

  if (!timeLeft) return <span className="text-rose-600 font-black animate-pulse">EXPIRÉ ⚠️</span>;

  const isUrgent = timeLeft.d === 0 && timeLeft.h < 24;

  return (
    <div className={`flex gap-1 items-center font-black tabular-nums ${isUrgent ? 'text-rose-500' : 'text-indigo-600'}`}>
      <span className="text-[10px] uppercase opacity-50 mr-1">Reste:</span>
      {timeLeft.d > 0 && <span>{timeLeft.d}j</span>}
      <span>{timeLeft.h}h</span>
      <span>{timeLeft.m}m</span>
      <span className="text-[8px] opacity-40">{timeLeft.s}s</span>
    </div>
  );
};

export const FocusMode: React.FC<{ owner: Owner }> = ({ owner }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({
    text: '',
    deadline: '',
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
    if (!newNote.text || !newNote.deadline) return;
    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote.text,
      deadline: newNote.deadline,
      isCompleted: false,
      owner: newNote.owner,
      priority: newNote.priority
    };
    await DB.saveNote(note);
    setNewNote({ ...newNote, text: '' });
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Objectifs Focus</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ne perdez jamais le fil</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          {showAdd ? 'Fermer' : 'Nouvelle Note'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-2xl space-y-4">
          <textarea 
            placeholder="Écris ton objectif ici... (ex: Envoyer le stock FTID)"
            className="w-full bg-slate-50 rounded-2xl p-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 min-h-[100px]"
            value={newNote.text}
            onChange={e => setNewNote({...newNote, text: e.target.value})}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Deadline</label>
               <input 
                 type="datetime-local" 
                 className="w-full bg-slate-50 p-4 rounded-xl font-bold text-xs"
                 value={newNote.deadline}
                 onChange={e => setNewNote({...newNote, deadline: e.target.value})}
                 required
               />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Pour qui</label>
               <select 
                 className="w-full bg-slate-50 p-4 rounded-xl font-bold text-xs"
                 value={newNote.owner}
                 onChange={e => setNewNote({...newNote, owner: e.target.value as any})}
               >
                 <option value={Owner.LARBI}>Larbi</option>
                 <option value={Owner.YASSINE}>Yassine</option>
               </select>
            </div>
            <div className="pt-4 md:pt-5">
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg">Ajouter au calendrier</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.filter(n => !n.isCompleted).map(note => (
          <div key={note.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md group relative overflow-hidden flex flex-col justify-between h-56">
            <div className={`absolute top-0 right-0 w-16 h-16 blur-3xl opacity-20 transition-colors ${note.priority === 'Urgent' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${note.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                  {note.owner}
                </span>
                <Countdown deadline={note.deadline} />
              </div>
              <p className="text-sm font-black text-slate-800 leading-snug uppercase tracking-tight">{note.text}</p>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => toggleComplete(note)}
                className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-xl text-[9px] font-black uppercase border border-emerald-100 active:scale-95 transition-all"
              >
                Fait ✅
              </button>
              <button 
                onClick={() => deleteNote(note.id)}
                className="w-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 active:scale-90 transition-all"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
        
        {/* Affichage des tâches terminées en fin de liste (discret) */}
        {notes.filter(n => n.isCompleted).map(note => (
          <div key={note.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 opacity-60 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <span className="text-emerald-500">✓</span>
               <p className="text-xs font-bold text-slate-400 line-through truncate w-32 md:w-48">{note.text}</p>
             </div>
             <button onClick={() => deleteNote(note.id)} className="text-rose-400 p-2"><Icons.Trash /></button>
          </div>
        ))}

        {notes.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
             <span className="text-4xl block mb-4">🥂</span>
             <p className="text-xs font-black uppercase text-slate-300">Tout est sous contrôle. Aucune tâche en attente.</p>
          </div>
        )}
      </div>
    </div>
  );
};
