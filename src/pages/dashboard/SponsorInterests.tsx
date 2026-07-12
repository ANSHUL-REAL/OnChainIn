import { Link } from 'react-router';
import { Calendar, Gift, Handshake } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';

export default function SponsorInterests() {
  const user = store.getCurrentUser();
  const interests = user ? store.getSponsorInterestsBySponsor(user.id) : [];

  return (
    <DashboardLayout title="My Sponsor Interests">
      {interests.length === 0 ? (
        <div className="workspace-empty">
          <Handshake className="mx-auto mb-3 h-12 w-12 text-[#52670F]/30" />
          <p className="mb-4 text-sm font-semibold text-[#5E6256]">No sponsor interests submitted yet.</p>
          <Link to="/dashboard/sponsor/events" className="gold-btn inline-flex text-sm">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {interests.map((interest) => (
            <div key={interest.id} className="workspace-card rounded-[1.5rem] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#DCE8BE] bg-[#EEF5D9]">
                  <Gift className="h-5 w-5 text-[#52670F]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-base font-black text-[#14150F]">{interest.event?.title || 'Sponsor interest'}</p>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black capitalize ${
                      interest.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : interest.status === 'rejected'
                          ? 'bg-red-50 text-red-600'
                          : interest.status === 'contacted'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                    }`}>
                      {interest.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-[#52670F]">{interest.sponsorship_type || interest.package?.title || 'General Sponsorship'}</p>
                  {interest.contribution_details && <p className="mt-2 text-sm leading-6 text-[#5E6256]">{interest.contribution_details}</p>}
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#5E6256]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(interest.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
