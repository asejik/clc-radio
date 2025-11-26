import { AudioPlayer } from './components/AudioPlayer';
import { ScheduleList } from './components/ScheduleList';
import { useRadioSchedule } from './hooks/useRadioSchedule';

const FILLER_URL = "https://archive.org/download/mythium/JLS_ATI.mp3";

function App() {
  const { currentTrack, offset, isLive, schedule } = useRadioSchedule();

  // Logic: If currentTrack exists, use it. Otherwise, use Filler.
  const activeSrc = currentTrack ? currentTrack.audioUrl : FILLER_URL;
  const activeOffset = currentTrack ? offset : 0;

  return (
    // Changed bg to pure black for better contrast with blobs
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">

      {/* --- BACKGROUND BLOBS (Boosted Visibility) --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Purple Blob: Increased opacity to 0.6 and size */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob"></div>
        {/* Cyan Blob: Increased opacity to 0.6 and size */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/40 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">

        {/* Header Badge */}
        <div className="mb-8 flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
          <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${isLive ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-zinc-500 text-zinc-500'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
            {/* UPDATED TEXT */}
            {isLive ? "FREEDOM ON AIR" : "OFFLINE • WORSHIP"}
          </span>
        </div>

        {/* The Audio Engine */}
        <AudioPlayer
          src={activeSrc}
          startTimeOffset={activeOffset}
          isFiller={!isLive}
          title={currentTrack?.title}
          artist={currentTrack?.artist}
          coverImage="/cover.jpg"
        />

        {/* The Schedule List */}
        <ScheduleList
          schedule={schedule}
          currentTrackId={currentTrack?.id}
        />

        {/* Footer */}
        <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity">
          {/* UPDATED TEXT */}
          <p className="text-[10px] uppercase tracking-widest font-medium">CLC Radio App</p>
        </div>

      </div>
    </div>
  );
}

export default App;