import type { ScheduleItem } from '../types';

interface ScheduleListProps {
  schedule: ScheduleItem[];
  currentTrackId?: string;
}

export const ScheduleList = ({ schedule, currentTrackId }: ScheduleListProps) => {
  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="w-full max-w-sm mt-8 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-2 opacity-80">
        <div className="w-1 h-4 bg-cyan-400 rounded-full"></div>
        <h3 className="text-white text-xs font-bold uppercase tracking-[0.2em]">
          Up Next
        </h3>
      </div>

      {/* Glass Container */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {schedule.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
             <p className="text-zinc-500 text-sm">No upcoming shows.</p>
          </div>
        ) : (
          schedule.map((item) => {
            const isActive = item.id === currentTrackId;
            return (
              <div
                key={item.id}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Text Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${isActive ? 'text-cyan-400' : 'text-zinc-200'}`}>
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 truncate group-hover:text-zinc-400 transition-colors">
                      {item.artist}
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className={`text-xs font-mono py-1 px-2 rounded-lg ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-white/5 text-zinc-500'
                  }`}>
                    {formatTime(item.startTime.seconds)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};