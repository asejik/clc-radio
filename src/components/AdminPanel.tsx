import { useState } from 'react';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Loader2, Save, Upload, FileText, Plus } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // --- SINGLE FORM STATE ---
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [datetime, setDatetime] = useState('');
  const [durationMins, setDurationMins] = useState('60');

  // --- BULK FORM STATE ---
  const [bulkText, setBulkText] = useState('');

  // --- HELPER: Parse HH:MM:SS to Total Seconds ---
  const parseDurationString = (timeStr: string) => {
    // Expected format: "01:22:02" or "1:22:02"
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    }
    return 0; // Fallback
  };

  // --- HELPER: Parse "30/11/2025 | 09:00 AM" to Date Object ---
  const parseCustomDate = (dateStr: string) => {
    // Split "30/11/2025" and "09:00 AM"
    const [datePart, timePart] = dateStr.split('|').map(s => s.trim());

    // Parse Date: 30/11/2025
    const [day, month, year] = datePart.split('/').map(Number);

    // Parse Time: 09:00 AM
    const [time, modifier] = timePart.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM') {
      hours = hours + 12;
    }

    // Create Date Object
    return new Date(year, month - 1, day, hours, minutes);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const newRef = doc(collection(db, "schedule"));

      batch.set(newRef, {
        title,
        artist,
        audioUrl,
        startTime: Timestamp.fromDate(new Date(datetime)),
        durationSeconds: parseInt(durationMins) * 60
      });

      await batch.commit();
      setStatusMsg("Single show added successfully!");
      setTitle(''); setArtist(''); setAudioUrl('');
    } catch (error) {
      console.error(error);
      alert("Error adding show.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText) return;
    setLoading(true);
    setStatusMsg("Parsing and uploading...");

    try {
      const batch = writeBatch(db);
      // Split by double newline to get blocks
      const blocks = bulkText.split('\n\n');
      let count = 0;

      blocks.forEach(block => {
        if (!block.trim()) return;

        const lines = block.split('\n');
        const data: any = {};

        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (!key || !valueParts) return;
          const value = valueParts.join(':').trim(); // Rejoin in case URL has http://

          if (key.trim() === 'title') data.title = value;
          if (key.trim() === 'artist') data.artist = value;
          if (key.trim() === 'audioUrl') data.audioUrl = value;

          if (key.trim() === 'startTime') {
            // Use our custom helper
            const dateObj = parseCustomDate(value);
            data.startTime = Timestamp.fromDate(dateObj);
          }

          if (key.trim() === 'durationSeconds') {
            // Check if it's HH:MM:SS or just a number
            if (value.includes(':')) {
              data.durationSeconds = parseDurationString(value);
            } else {
              data.durationSeconds = parseInt(value);
            }
          }
        });

        if (data.title && data.startTime) {
          const newRef = doc(collection(db, "schedule"));
          batch.set(newRef, data);
          count++;
        }
      });

      await batch.commit();
      setStatusMsg(`Success! Uploaded ${count} shows.`);
      setBulkText('');
    } catch (err) {
      console.error(err);
      alert("Error parsing bulk text. Check format.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-lg relative z-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
            <ArrowLeft className="text-white" />
          </button>
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
        <button
          onClick={() => setMode('single')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'single' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
        >
          <Plus size={16} /> Single Entry
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'bulk' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
        >
          <FileText size={16} /> Bulk Upload
        </button>
      </div>

      {/* STATUS MESSAGE */}
      {statusMsg && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center text-sm font-bold animate-pulse">
          {statusMsg}
        </div>
      )}

      {/* --- SINGLE ENTRY FORM --- */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition" placeholder="e.g. Sunday Service" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preacher / Artist</label>
            <input required type="text" value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition" placeholder="e.g. Apostle Segun" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Audio URL</label>
            <input required type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition" placeholder="https://..." />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Time</label>
              <input required type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition dark:[color-scheme:dark]" />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Mins</label>
              <input required type="number" value={durationMins} onChange={e => setDurationMins(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-black mt-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Single</>}
          </button>
        </form>
      )}

      {/* --- BULK UPLOAD FORM --- */}
      {mode === 'bulk' && (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-200">
              Paste your list below. Format each entry with: <br/>
              <span className="font-mono text-white/70">title: ... <br/>startTime: DD/MM/YYYY | HH:MM AM<br/>durationSeconds: HH:MM:SS</span>
            </p>
          </div>

          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={`title: Morning Devotion\nartist: Pastor John\nstartTime: 30/11/2025 | 09:00 AM\n...`}
            className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition resize-none custom-scrollbar"
          />

          <button
            disabled={loading || !bulkText}
            onClick={handleBulkSubmit}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white mt-4 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Upload size={18} /> Upload Batch</>}
          </button>
        </div>
      )}
    </div>
  );
};