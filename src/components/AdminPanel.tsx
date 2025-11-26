import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [datetime, setDatetime] = useState(''); // "2025-11-26T14:00"
  const [durationMins, setDurationMins] = useState('60');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Convert Local Datetime String to JS Date object
      const dateObj = new Date(datetime);

      // 2. Convert to Firestore Timestamp
      const firestoreTime = Timestamp.fromDate(dateObj);

      // 3. Convert Duration (mins -> seconds)
      const durationSecs = parseInt(durationMins) * 60;

      // 4. Send to Firebase
      await addDoc(collection(db, "schedule"), {
        title,
        artist,
        audioUrl,
        startTime: firestoreTime,
        durationSeconds: durationSecs
      });

      // 5. Reset Form
      setSuccess(true);
      setTitle('');
      setArtist('');
      setAudioUrl('');
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative z-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Add Schedule</h2>
      </div>

      {/* Glass Form */}
      <form onSubmit={handleSubmit} className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] space-y-4">

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
          <input
            required
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition"
            placeholder="e.g. Sunday Service"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preacher / Artist</label>
          <input
            required
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition"
            placeholder="e.g. Apostle Segun"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Audio URL (Archive.org)</label>
          <input
            required
            type="url"
            value={audioUrl}
            onChange={e => setAudioUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition"
            placeholder="https://archive.org/..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Time</label>
            <input
              required
              type="datetime-local"
              value={datetime}
              onChange={e => setDatetime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition dark:[color-scheme:dark]"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Mins</label>
            <input
              required
              type="number"
              value={durationMins}
              onChange={e => setDurationMins(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-black mt-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Add to Schedule</>}
        </button>

        {success && (
          <div className="text-center text-green-400 text-sm font-bold animate-pulse">
            Success! Schedule Updated.
          </div>
        )}

      </form>
    </div>
  );
};