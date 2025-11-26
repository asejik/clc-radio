import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, Share2, Check } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  startTimeOffset: number;
  isFiller: boolean;
  title?: string;
  artist?: string;
  coverImage?: string;
}

export const AudioPlayer = ({
  src,
  startTimeOffset,
  isFiller,
  title,
  artist,
  coverImage = "/cover.jpg"
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false); // NEW: Buffering State
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [copied, setCopied] = useState(false); // NEW: Share feedback

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src;

      const onLoadedMetadata = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = isFiller ? 0 : startTimeOffset;
          // Try to play
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
             playPromise
               .then(() => setIsPlaying(true))
               .catch(() => setIsPlaying(false));
          }
        }
      };

      // NEW: Listeners for buffering
      const onWaiting = () => setIsBuffering(true);
      const onPlaying = () => setIsBuffering(false);
      const onEnded = () => !isFiller && setIsPlaying(false);

      audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
      audioRef.current.addEventListener('waiting', onWaiting);
      audioRef.current.addEventListener('playing', onPlaying);
      audioRef.current.addEventListener('ended', onEnded);

      return () => {
        audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioRef.current?.removeEventListener('waiting', onWaiting);
        audioRef.current?.removeEventListener('playing', onPlaying);
        audioRef.current?.removeEventListener('ended', onEnded);
      };
    }
  }, [src, isFiller]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // NEW: Share Function
  const handleShare = async () => {
    const shareData = {
      title: 'CLC Freedom Radio',
      text: 'Listening to Freedom Radio - Tune in now!',
      url: window.location.href,
    };

    // Use native mobile share if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full max-w-sm group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

      <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[1.75rem] flex flex-col items-center overflow-hidden">

        <audio ref={audioRef} loop={isFiller} />

        {/* Share Button (Top Right) */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          title="Share Station"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
        </button>

        {/* Album Art */}
        <div className="relative w-32 h-32 mb-6 shadow-2xl mt-2">
          <img
            src={coverImage}
            alt="Album Art"
            className={`w-full h-full object-cover rounded-2xl transition-transform duration-700 ${
              isPlaying ? 'scale-100' : 'scale-95 grayscale-[50%]'
            }`}
          />
        </div>

        {/* Typography */}
        <div className="w-full overflow-hidden relative mb-8">
          <div className={`whitespace-nowrap ${
            (title || "").length > 20 ? "animate-marquee inline-block" : "text-center"
          }`}>
             <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              {isFiller ? "WORSHIP MODE" : title}
            </h2>
            <div className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest mt-1">
              {isFiller ? "Continuous Play" : artist}
            </div>
          </div>
           <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/60 to-transparent pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/60 to-transparent pointer-events-none"></div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full px-2">

          {/* Visualizer */}
          <div className="w-12 h-8 flex items-end gap-1">
            {isPlaying && !isBuffering && (
              <>
                <div className="w-1 bg-cyan-400 rounded-full animate-visualizer-1"></div>
                <div className="w-1 bg-purple-400 rounded-full animate-visualizer-2"></div>
                <div className="w-1 bg-cyan-400 rounded-full animate-visualizer-3"></div>
                <div className="w-1 bg-purple-400 rounded-full animate-visualizer-4"></div>
              </>
            )}
          </div>

          {/* Play/Buffering Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all active:scale-95 z-10 relative"
          >
            {isBuffering ? (
              <Loader2 className="animate-spin text-zinc-400" size={24} />
            ) : isPlaying ? (
              <Pause fill="black" size={24} />
            ) : (
              <Play fill="black" className="ml-1" size={24} />
            )}
          </button>

          {/* Volume */}
          <div className="group/vol relative flex items-center w-12 justify-end">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 h-24 bg-zinc-800 rounded-full hidden group-hover/vol:flex flex-col justify-end items-center py-3 border border-zinc-700 shadow-xl z-20">
               <input
                type="range"
                min="0" max="1" step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setVolume(vol);
                  if(audioRef.current) {
                    audioRef.current.volume = vol;
                    audioRef.current.muted = false;
                    setIsMuted(false);
                  }
                }}
                className="h-16 w-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer outline-none"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};