import { Link } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Award, ExternalLink, Shield, Sparkles } from 'lucide-react';

export default function ParticipantPassport() {
  const user = store.getCurrentUser();
  const records = user ? store.getUserPassportRecords(user.id) : [];

  return (
    <DashboardLayout title="My Proof Passport">
      <div className="glass-card rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E49B3A]/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#E49B3A]" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">{user?.full_name}</p>
            <p className="text-xs text-white/35">@{user?.username}</p>
          </div>
        </div>
        <Link to={`/passport/${user?.username}`} className="gold-btn text-sm flex items-center justify-center gap-2">
          Public Passport <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No proof records yet. Attend events or complete verified work to build your passport.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => (
            <div key={record.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E49B3A]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-[#E49B3A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{record.title}</p>
                <p className="text-xs text-white/35 mt-1">{record.event?.title || record.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">{record.record_type}</span>
                  {record.hours > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{record.hours}h</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
