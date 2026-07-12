import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Trophy, Medal, Award, CheckCircle, Clock, UserCheck, Sparkles } from 'lucide-react';

const badgeStyles: Record<string, string> = {
  Champion: 'bg-[#E49B3A]/20 text-[#E49B3A]',
  Pro: 'bg-purple-500/20 text-purple-300',
  'Rising Star': 'bg-blue-500/20 text-blue-300',
  'Task Master': 'bg-emerald-500/20 text-emerald-300',
  'Check-in Hero': 'bg-cyan-500/20 text-cyan-300',
  Marathoner: 'bg-rose-500/20 text-rose-300',
};

function rankAccent(rank: number) {
  if (rank === 1) return 'text-[#E49B3A]';
  if (rank === 2) return 'text-white/70';
  if (rank === 3) return 'text-amber-600';
  return 'text-white/40';
}

export default function VolunteerLeaderboard() {
  const user = store.getCurrentUser();
  const leaderboard = store.getVolunteerLeaderboard();
  const top3 = leaderboard.slice(0, 3);

  return (
    <DashboardLayout title="Volunteer Leaderboard">
      <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
        <Sparkles className="w-4 h-4 text-[#E49B3A]" />
        <span>Points: <strong className="text-white">50</strong> / task completed · <strong className="text-white">10</strong> / hour · <strong className="text-white">15</strong> / check-in handled.</span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No volunteer activity yet. Complete tasks and handle check-ins to climb the leaderboard.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {top3.map((entry) => (
                <div key={entry.user_id} className={`glass-card rounded-xl p-4 text-center ${entry.rank === 1 ? 'border-[#E49B3A]/40' : ''}`}>
                  <div className="flex justify-center mb-2">
                    {entry.rank === 1 && <Trophy className="w-8 h-8 text-[#E49B3A]" />}
                    {entry.rank === 2 && <Medal className="w-8 h-8 text-white/60" />}
                    {entry.rank === 3 && <Medal className="w-8 h-8 text-amber-600" />}
                  </div>
                  <p className="text-sm font-bold text-white truncate">{entry.full_name}</p>
                  <p className="text-2xl font-black text-[#E49B3A] my-1">{entry.points}</p>
                  <p className="text-[10px] text-white/40">points</p>
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {entry.badges.slice(0, 2).map(b => <span key={b} className={`text-[9px] px-1.5 py-0.5 rounded-full ${badgeStyles[b] || 'bg-white/10 text-white/50'}`}>{b}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full ranking */}
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.user_id === user?.id;
              return (
                <div key={entry.user_id} className={`glass-card rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 ${isMe ? 'border-[#E49B3A]/50' : ''}`}>
                  <div className={`w-9 text-center text-lg font-black ${rankAccent(entry.rank)}`}>#{entry.rank}</div>
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                    {entry.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{entry.full_name}</p>
                      {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E49B3A]/20 text-[#E49B3A] shrink-0">You</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {entry.tasksCompleted} tasks</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.hours}h</span>
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {entry.checkInsHandled} check-ins</span>
                    </div>
                    {entry.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.badges.map(b => <span key={b} className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${badgeStyles[b] || 'bg-white/10 text-white/50'}`}><Award className="w-2.5 h-2.5" />{b}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[#E49B3A]">{entry.points}</p>
                    <p className="text-[9px] text-white/30">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
