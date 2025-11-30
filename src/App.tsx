import { useState } from 'react';
import { AudioPlayer } from './components/AudioPlayer';
import { ScheduleList } from './components/ScheduleList';
import { AdminPanel } from './components/AdminPanel';
import { useRadioSchedule } from './hooks/useRadioSchedule';
import { Lock, X, ChevronRight } from 'lucide-react';

function App() {
  const { currentTrack, offset, isLive, schedule, fillerPlaylist } = useRadioSchedule();

  // State for Views
  const [showAdmin, setShowAdmin] = useState(false);

  // State for Custom Password Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Logic: If live, use track URL. If filler, AudioPlayer handles the random URL.
  const activeSrc = currentTrack ? currentTrack.audioUrl : "";

  // Handle Password Submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (passwordInput === correctPassword) {
      setShowAdmin(true);
      setShowAuthModal(false); // Close modal
      setPasswordInput('');    // Clear input
      setAuthError(false);
    } else {
      setAuthError(true);
      // Shake effect logic could go here
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

      {/* 1. PASSWORD MODAL OVERLAY */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900/90 border border-white/10 p-6 rounded-2xl w-full max-w-xs shadow-2xl transform transition-all scale-100 relative">

            <button
              onClick={() => { setShowAuthModal(false); setAuthError(false); setPasswordInput(''); }}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Access</h3>
              <p className="text-xs text-zinc-400">Enter secure PIN to continue</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                autoFocus
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="PIN Code"
                className={`w-full bg-black/50 border ${authError ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 text-center text-white text-lg tracking-widest focus:outline-none focus:border-cyan-500 transition`}
              />
              {authError && <p className="text-xs text-red-400 text-center font-bold">Incorrect Password</p>}

              <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition flex items-center justify-center gap-2">
                Unlock <ChevronRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MAIN APP VIEWS */}
      {showAdmin ? (
        <AdminPanel onBack={() => setShowAdmin(false)} />
      ) : (
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
            {/* The "Secret" Lock Button - NOW OPENS MODAL */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="p-1 hover:bg-white/10 rounded transition"
            >
              <Lock size={12} className="text-zinc-600" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;