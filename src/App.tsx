import { useState, useEffect } from 'react'; // Add useEffect
import { AudioPlayer } from './components/AudioPlayer';
import { ScheduleList } from './components/ScheduleList';
import { AdminPanel } from './components/AdminPanel';
import { useRadioSchedule } from './hooks/useRadioSchedule';
import { useListenerCount } from './hooks/useListenerCount';
import { Lock, X, ChevronRight, Users, LogOut } from 'lucide-react'; // Add LogOut
import { auth } from './lib/firebase'; // Import auth
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'; // Import Auth functions

function App() {
  const { currentTrack, offset, isLive, schedule, fillerPlaylist } = useRadioSchedule();
  const listenerCount = useListenerCount();

  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState(''); // Changed from passwordInput
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [user, setUser] = useState<any>(null); // Track logged in user

  // Check login status on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If already logged in, show admin immediately?
        // Or just allow access when they click lock.
      }
    });
    return () => unsubscribe();
  }, []);

  const activeSrc = currentTrack ? currentTrack.audioUrl : "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);

    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      setShowAuthModal(false);
      setShowAdmin(true);
      setEmailInput('');
      setPasswordInput('');
    } catch (error) {
      console.error(error);
      setAuthError(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowAdmin(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">

      {/* BACKGROUND BLOBS ... (Keep existing) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>

      {/* --- MODAL (UPDATED FOR EMAIL/PASS) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900/90 border border-white/10 p-6 rounded-2xl w-full max-w-xs shadow-2xl transform transition-all scale-100 relative">
            <button
              onClick={() => { setShowAuthModal(false); setAuthError(false); }}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Login</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                autoFocus
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@clcradio.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                className={`w-full bg-black/50 border ${authError ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition`}
              />
              {authError && <p className="text-xs text-red-400 text-center font-bold">Invalid Credentials</p>}

              <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition flex items-center justify-center gap-2">
                Login <ChevronRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdmin ? (
        // Pass a Logout button capability or wrap AdminPanel
        <div className="w-full max-w-lg flex flex-col">
            <div className="self-end mb-2">
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold px-3 py-2 bg-red-500/10 rounded-lg">
                    <LogOut size={12} /> Logout
                </button>
            </div>
            <AdminPanel onBack={() => setShowAdmin(false)} schedule={schedule} />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
          {/* ... (Keep existing Header Badges, AudioPlayer, ScheduleList) ... */}

          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${isLive ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-zinc-500 text-zinc-500'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                {isLive ? "FREEDOM ON AIR" : "OFFLINE • WORSHIP"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <Users size={12} className="text-cyan-400" />
              <span className="text-[10px] font-bold tracking-widest text-cyan-400">
                {listenerCount} LISTENING
              </span>
            </div>
          </div>

          <AudioPlayer
            src={activeSrc}
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
            {/* Logic: If user is already logged in, go straight to Admin, else show Modal */}
            <button
              onClick={() => user ? setShowAdmin(true) : setShowAuthModal(true)}
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