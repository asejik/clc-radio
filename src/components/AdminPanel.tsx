import { useState } from 'react';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
// REMOVED 'Music' from this import list
import { ArrowLeft, Loader2, Upload, FileText, Plus } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('bulk');
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
    setStatusMsg("Parsing...");

    try {
      const batch = writeBatch(db);
      const blocks = bulkText.split('\n\n');
      let count = 0;

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
             if (cleanKey === 'starttime') {
               data.startTime = Timestamp.fromDate(parseCustomDate(value));
             }
             if (cleanKey === 'durationseconds') {
               data.durationSeconds = value.includes(':') ? parseDurationString(value) : parseInt(value);
             }
          }
        });

        const isValid = data.title && data.audioUrl && (targetCollection === 'filler' || (data.startTime && data.durationSeconds));

        if (isValid) {
          const newRef = doc(collection(db, targetCollection));
          batch.set(newRef, data);
          count++;
        }
      });

      await batch.commit();
      setStatusMsg(`Success! Uploaded ${count} items to ${targetCollection}.`);
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
          WORSHIP (FILLER)
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'single' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
          <Plus size={16} /> Single
        </button>
        <button onClick={() => setMode('bulk')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'bulk' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
          <FileText size={16} /> Bulk
        </button>
      </div>

      {statusMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center text-sm font-bold animate-pulse">{statusMsg}</div>}

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

      {mode === 'bulk' && (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={targetCollection === 'schedule' ? "title: ...\nstartTime: ...\n..." : "Title: Oceans\nArtist: Hillsong\nUrl: https://..."}
            className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-4 text-xs font-mono text-white custom-scrollbar"
          />
          <button disabled={loading || !bulkText} onClick={handleBulkSubmit} className="w-full py-4 bg-purple-500 rounded-xl font-bold text-white mt-4">{loading ? <Loader2 className="animate-spin" /> : <><Upload size={18} /> Upload Batch</>}</button>
        </div>
      )}
    </div>
  );
};