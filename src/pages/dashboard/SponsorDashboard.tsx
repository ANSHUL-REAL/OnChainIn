import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SponsorImpactSummary } from '@/components/SponsorImpactSummary';
import store from '@/data/store';
import { Calendar, Handshake, CheckCircle, ArrowRight, Shield } from 'lucide-react';

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const stats = user ? store.getSponsorStats(user.id) : { matchingEvents: 0, submittedInterests: 0, confirmedPartnerships: 0 };
  const interests = user ? store.getSponsorInterestsBySponsor(user.id) : [];

  const statCards = [
    { icon: Calendar, label: 'Matching Events', value: stats.matchingEvents },
    { icon: Handshake, label: 'Interests Submitted', value: stats.submittedInterests },
    { icon: CheckCircle, label: 'Confirmed', value: stats.confirmedPartnerships },
  ];

  return (
    <DashboardLayout title="Sponsor Dashboard">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="workspace-stat-card">
            <s.icon className="w-5 h-5 mb-3" />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[10px] font-black tracking-wide uppercase text-[#5E6256]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/sponsor/events')} className="workspace-card rounded-[1.5rem] p-6 w-full text-left flex items-center gap-4">
          <span className="workspace-icon"><Calendar className="w-5 h-5" /></span>
          <div className="flex-1">
            <p className="text-lg font-black text-[#14150F]">Browse Events</p>
            <p className="text-sm text-[#5E6256]">Find events that match your sponsorship goals</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#52670F]" />
        </button>
      </div>

      <h2 className="text-xl font-black text-[#14150F] mb-4">My Interests</h2>
      {interests.length === 0 ? (
        <div className="workspace-empty">
          <Handshake className="w-12 h-12 text-[#52670F]/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#5E6256]">No interests submitted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.map((si) => (
            <div key={si.id} className="space-y-3">
              <div className="workspace-card rounded-2xl p-4 flex items-center gap-3">
                <span className="workspace-icon flex-shrink-0"><Handshake className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#14150F] truncate">{si.event?.title}</p>
                  <p className="text-[10px] text-[#5E6256]">{si.package?.title || 'General Interest'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${si.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : si.status === 'rejected' ? 'bg-red-500/20 text-red-400' : si.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>{si.status}</span>
              </div>
              {si.event && <SponsorImpactSummary eventId={si.event.id} compact />}
            </div>
          ))}
        </div>
      )}

      <div className="workspace-card rounded-[1.5rem] p-5 mt-8">
        <div className="flex items-start gap-3">
          <span className="workspace-icon"><Shield className="w-5 h-5" /></span>
          <div>
            <p className="text-lg font-black text-[#14150F]">OnChainIn Proof Engine for sponsors</p>
            <p className="text-sm text-[#5E6256] mt-1">
              Sponsor impact is calculated from real registrations, approved attendees, check-ins, package benefits, and sponsor interest records.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
