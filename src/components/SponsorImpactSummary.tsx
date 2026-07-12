import { BarChart3, CheckCircle, Handshake, Radar, Shield, Users } from 'lucide-react';
import { getSponsorImpact } from '@/lib/proofEngine';

type SponsorImpactSummaryProps = {
  eventId: string;
  compact?: boolean;
};

export function SponsorImpactSummary({ eventId, compact = false }: SponsorImpactSummaryProps) {
  const impact = getSponsorImpact(eventId);

  if (!impact) {
    return (
      <div className="workspace-empty">
        <Shield className="w-10 h-10 text-[#52670F]/30 mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#5E6256]">Sponsor impact data is unavailable for this event.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Registrations', value: impact.totalRegistrations, icon: Users },
    { label: 'Checked in', value: impact.checkedInAttendees, icon: CheckCircle },
    { label: 'Sponsor leads', value: impact.sponsorLeads, icon: Handshake },
    { label: 'Reach score', value: `${impact.reachScore}%`, icon: Radar },
  ];

  return (
    <section className={compact
      ? 'rounded-[1.25rem] border border-[#DCE8BE] bg-[#F8FBEF]/80 p-4'
      : 'workspace-card rounded-[1.5rem] p-5 sm:p-6'
    }>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="workspace-kicker">Sponsor Proof Summary</p>
          <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-[#14150F] mt-2`}>{impact.event.title}</h3>
          <p className="text-sm text-[#5E6256] mt-2">
            Real event reach based on registrations, approved attendees, check-ins, sponsor leads, and package visibility.
          </p>
        </div>
        <span className="workspace-chip self-start"><Shield className="w-3.5 h-3.5" /> OnChainIn verified impact</span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-2' : 'sm:grid-cols-4'} gap-3 mt-5`}>
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#DCE8BE] bg-white/60 p-3">
            <stat.icon className="w-4 h-4 text-[#52670F] mb-2" />
            <p className="text-xl font-black text-[#14150F]">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-[#5E6256]">{stat.label}</p>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="grid lg:grid-cols-2 gap-4 mt-5">
          <div className="rounded-2xl border border-[#DCE8BE] bg-white/55 p-4">
            <div className="flex items-center gap-2 text-[#52670F] mb-3">
              <BarChart3 className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-[0.18em]">Visibility Benefits</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {impact.visibilityBenefits.map((benefit) => (
                <span key={benefit} className="workspace-chip">{benefit}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCE8BE] bg-white/55 p-4">
            <div className="flex items-center gap-2 text-[#52670F] mb-3">
              <Shield className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-[0.18em]">Engagement Proof</p>
            </div>
            <div className="space-y-2">
              {impact.engagementProof.map((proof) => (
                <p key={proof} className="flex items-center gap-2 text-sm font-semibold text-[#3F4531]">
                  <CheckCircle className="w-4 h-4 text-[#52670F] flex-none" />
                  {proof}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
