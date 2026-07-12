import { Link } from 'react-router';
import { Calendar, Clock, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import type { Registration } from '@/types';

const statusLabel: Record<Registration['status'], string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  attended: 'Attended',
  cancelled: 'Cancelled',
};

function badge(status: Registration['status']) {
  if (status === 'pending') return 'bg-amber-500/15 text-amber-300';
  if (status === 'approved') return 'bg-blue-500/15 text-blue-300';
  if (status === 'attended') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'rejected') return 'bg-red-500/15 text-red-300';
  return 'bg-white/10 text-white/40';
}

export default function ParticipantApplications() {
  const user = store.getCurrentUser();
  const registrations = user ? store.getParticipantRegistrations(user.id) : [];
  const events = store.getEvents();

  return (
    <DashboardLayout title="My Applications">
      {registrations.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 mb-4">No applications yet. Browse events and submit an organizer form.</p>
          <Link to="/dashboard/participant/browse" className="gold-btn text-sm">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map(registration => {
            const event = events.find(item => item.id === registration.event_id);
            if (!event) return null;
            return (
              <div key={registration.id} className="glass-card rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/35">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Applied {new Date(registration.registered_at).toLocaleDateString()}</span>
                    </div>
                    {registration.status === 'pending' && <p className="text-xs text-white/35 mt-3">Waiting for organizer approval. QR ticket appears only after approval.</p>}
                    {registration.status === 'rejected' && <p className="text-xs text-red-200/80 mt-3">{registration.rejection_reason || 'The organizer rejected this application.'}</p>}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${badge(registration.status)}`}>{statusLabel[registration.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
