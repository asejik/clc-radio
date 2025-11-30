import { useState } from 'react';
import { AudioPlayer } from './components/AudioPlayer';
import { ScheduleList } from './components/ScheduleList';
import { AdminPanel } from './components/AdminPanel';
import { useRadioSchedule } from './hooks/useRadioSchedule';
import { Lock } from 'lucide-react';

function App() {
  const { currentTrack, offset, isLive, schedule, fillerPlaylist } = useRadioSchedule();
  const [showAdmin, setShowAdmin] = useState(false);

  // Logic: If live, use track URL. If filler, AudioPlayer handles the random URL.
  const activeSrc = currentTrack ? currentTrack.audioUrl : "";

  // Simple security check
  const handleAdminClick = () => {
    const password = prompt("Enter Admin Password:");

    // Read from the secure .env file
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === correctPassword) {
      setShowAdmin(true);
    } else if (password) {
      alert("Wrong Password");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">

      {/* BACKGROUND BLOBS */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>

      {/* --- CONTENT LAYER --- */}

      {showAdmin ? (
        // 1. ADMIN VIEW
        <AdminPanel onBack={() => setShowAdmin(false)} />
      ) : (
        // 2. RADIO VIEW
        <div className="relative z-10 flex flex-col items-center w-full max-w-md">

          <div className="mb-8 flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
            <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${isLive ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-zinc-500 text-zinc-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
              {isLive ? "FREEDOM ON AIR" : "OFFLINE • WORSHIP"}
            </span>
          </div>

          <AudioPlayer
            src={activeSrc}
            // Logic moved inline here to avoid unused variable error
            startTimeOffset={currentTrack ? offset : 0}
            isFiller={!isLive}
            title={currentTrack?.title}
            artist={currentTrack?.artist}
            coverImage="/cover.jpg"
            fillerPlaylist={fillerPlaylist}
          />

          <ScheduleList
            schedule={schedule}
            currentTrackId={currentTrack?.id}
          />

          <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
            <p className="text-[10px] uppercase tracking-widest font-medium">CLC Radio App</p>
            {/* The "Secret" Lock Button */}
            <button onClick={handleAdminClick} className="p-1 hover:bg-white/10 rounded transition">
              <Lock size={12} className="text-zinc-600" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;