import { useState } from 'react';
import { collection, writeBatch, doc, Timestamp, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
// REMOVED 'Upload' from imports
import { ArrowLeft, Loader2, FileText, Plus, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import type { ScheduleItem } from '../types';

interface AdminPanelProps {
  onBack: () => void;
  schedule: ScheduleItem[];
}

export const AdminPanel = ({ onBack, schedule }: AdminPanelProps) => {
  const [mode, setMode] = useState<'single' | 'bulk' | 'manage'>('manage');
  const [targetCollection, setTargetCollection] = useState<'schedule' | 'filler'>('schedule');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [bulkText, setBulkText] = useState('');

  // --- SINGLE FORM STATE ---
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [datetime, setDatetime] = useState('');
  const [durationMins, setDurationMins] = useState('60');

  // --- HELPERS ---
  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const parseDurationString = (timeStr: string) => {
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return 0;
  };

  const parseCustomDate = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split('|').map(s => s.trim());
    const [day, month, year] = datePart.split('/').map(Number);
    const [time, modifier] = timePart.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours = hours + 12;
    return new Date(year, month - 1, day, hours, minutes);
  };

  // --- ACTIONS ---

  const handleDelete = async (id: string, collectionName: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setStatusMsg("Item deleted.");
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const handleClearFuture = async () => {
    const pwd = prompt("Type 'DELETE' to confirm wiping all future shows:");
    if (pwd !== 'DELETE') return;

    setLoading(true);
    try {
      const now = new Date();
      const q = query(collection(db, "schedule"), where("startTime", ">", Timestamp.fromDate(now)));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setStatusMsg(`Deleted ${snapshot.size} future shows.`);
    } catch (e) {
      console.error(e);
      alert("Failed to clear schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const newRef = doc(collection(db, targetCollection));

      const data: any = { title, artist, audioUrl };

      if (targetCollection === 'schedule') {
        data.startTime = Timestamp.fromDate(new Date(datetime));
        data.durationSeconds = parseInt(durationMins) * 60;
      }

      batch.set(newRef, data);
      await batch.commit();
      setStatusMsg("Item added successfully!");
      setTitle(''); setArtist(''); setAudioUrl('');
    } catch (error) {
      console.error(error);
      alert("Error adding item.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText) return;
    setLoading(true);
    setStatusMsg("Analyzing...");

    try {
      const batch = writeBatch(db);
      const blocks = bulkText.split('\n\n');
      const parsedItems: any[] = [];

      // 1. Parse Phase
      blocks.forEach(block => {
        if (!block.trim()) return;
        const lines = block.split('\n');
        const data: any = {};

        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (!key || !valueParts) return;
          const cleanKey = key.trim().toLowerCase();
          const value = valueParts.join(':').trim();

          if (cleanKey === 'title') data.title = value;
          if (cleanKey === 'artist') data.artist = value;
          if (cleanKey === 'audiourl' || cleanKey === 'url') data.audioUrl = value;

          if (targetCollection === 'schedule') {
             if (cleanKey === 'starttime') data.startTime = Timestamp.fromDate(parseCustomDate(value));
             if (cleanKey === 'durationseconds') data.durationSeconds = value.includes(':') ? parseDurationString(value) : parseInt(value);
          }
        });

        const isValid = data.title && data.audioUrl && (targetCollection === 'filler' || (data.startTime && data.durationSeconds));
        if (isValid) parsedItems.push(data);
      });

      // 2. Conflict Check Phase
      if (targetCollection === 'schedule') {
        parsedItems.sort((a, b) => a.startTime.seconds - b.startTime.seconds);

        for (let i = 0; i < parsedItems.length - 1; i++) {
          const current = parsedItems[i];
          const next = parsedItems[i + 1];
          const currentEnd = current.startTime.seconds + current.durationSeconds;

          if (currentEnd > next.startTime.seconds) {
            setLoading(false);
            const conflictMsg = `CONFLICT DETECTED!\n\n"${current.title}" ends at ${formatTime(currentEnd)}\nBUT\n"${next.title}" starts at ${formatTime(next.startTime.seconds)}`;
            alert(conflictMsg);
            return;
          }
        }
      }

      // 3. Upload Phase
      parsedItems.forEach(item => {
        const newRef = doc(collection(db, targetCollection));
        batch.set(newRef, item);
      });

      await batch.commit();
      setStatusMsg(`Success! Uploaded ${parsedItems.length} items.`);
      setBulkText('');
    } catch (err) {
      console.error(err);
      alert("Error parsing text. Check format.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-lg relative z-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-white/5 p-2 rounded-xl border border-white/10">
        <button
          onClick={() => setTargetCollection('schedule')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${targetCollection === 'schedule' ? 'bg-green-500 text-black' : 'text-zinc-400'}`}
        >
          SCHEDULE
        </button>
        <button
          onClick={() => setTargetCollection('filler')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${targetCollection === 'filler' ? 'bg-purple-500 text-white' : 'text-zinc-400'}`}
        >
          WORSHIP
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('manage')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'manage' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
          <Calendar size={16} /> Manage
        </button>
        <button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'single' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
          <Plus size={16} /> Single
        </button>
        <button onClick={() => setMode('bulk')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'bulk' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
          <FileText size={16} /> Bulk
        </button>
      </div>

      {statusMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center text-sm font-bold animate-pulse">{statusMsg}</div>}

      {/* --- MANAGE TAB --- */}
      {mode === 'manage' && (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">

          {targetCollection === 'schedule' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
              <div className="text-red-200 text-xs font-bold">DANGER ZONE</div>
              <button
                onClick={handleClearFuture}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
              >
                <AlertTriangle size={14} /> Clear Future Shows
              </button>
            </div>
          )}

          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">
            {targetCollection === 'schedule' ? 'Upcoming Shows' : 'Worship Songs (Random)'}
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {targetCollection === 'schedule' ? (
              schedule.length === 0 ? <p className="text-zinc-500 text-xs">No upcoming schedule.</p> :
              schedule.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-white text-sm font-bold truncate">{item.title}</div>
                    <div className="text-zinc-500 text-xs">{formatTime(item.startTime.seconds)}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, 'schedule')}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
               <p className="text-zinc-500 text-xs text-center p-4">
                 (To manage Worship songs, delete them from Firestore console for now, or implement a fetch here.)
               </p>
            )}
          </div>
        </div>
      )}

      {/* --- SINGLE FORM --- */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" placeholder="Title" />
          <input required type="text" value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" placeholder="Artist" />
          <input required type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" placeholder="MP3 URL" />

          {targetCollection === 'schedule' && (
             <div className="flex gap-4">
                <input required type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm dark:[color-scheme:dark]" />
                <input required type="number" value={durationMins} onChange={e => setDurationMins(e.target.value)} className="w-20 bg-white/5 border border-white/10 rounded-lg p-3 text-white" />
             </div>
          )}

          <button disabled={loading} type="submit" className="w-full py-4 bg-cyan-500 rounded-xl font-bold text-black mt-4">{loading ? <Loader2 className="animate-spin" /> : "Save"}</button>
        </form>
      )}

      {/* --- BULK FORM --- */}
      {mode === 'bulk' && (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={targetCollection === 'schedule' ? "title: ...\nstartTime: ...\n..." : "Title: Oceans\nArtist: Hillsong\nUrl: https://..."}
            className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-4 text-xs font-mono text-white custom-scrollbar"
          />
          <button disabled={loading || !bulkText} onClick={handleBulkSubmit} className="w-full py-4 bg-purple-500 rounded-xl font-bold text-white mt-4">{loading ? <Loader2 className="animate-spin" /> : "Upload Batch"}</button>
        </div>
      )}
    </div>
  );
};