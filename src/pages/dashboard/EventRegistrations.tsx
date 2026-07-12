import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Registration } from '@/types';

const filters: Array<{ value: Registration['status']; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'attended', label: 'Attended' },
];

function statusClasses(status: Registration['status']) {
  if (status === 'pending') return 'bg-amber-500/20 text-amber-300';
  if (status === 'approved') return 'bg-blue-500/20 text-blue-300';
  if (status === 'attended') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'rejected') return 'bg-red-500/20 text-red-300';
  return 'bg-white/10 text-white/40';
}

export default function EventRegistrations() {
  const { id } = useParams<{ id: string }>();
  const event = store.getEventById(id || '');
  const organizer = store.getCurrentUser();
  const [activeFilter, setActiveFilter] = useState<Registration['status']>('pending');
  const [registrationsVersion, setRegistrationsVersion] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const registrations = useMemo(() => event ? store.getEventRegistrations(event.id) : [], [event, registrationsVersion]);
  const filteredRegistrations = registrations.filter(registration => registration.status === activeFilter);

  if (!event) return <DashboardLayout title="Registrations"><p className="text-white/40">Event not found</p></DashboardLayout>;

  const ownsEvent = organizer?.id === event.organizer_id;

  const approve = (registration: Registration) => {
    setSuccess('');
    setError('');
    if (!organizer || !ownsEvent) {
      setError('Only the organizer who owns this event can approve registrations.');
      return;
    }
    store.approveRegistration(registration.id, organizer.id);
    setRegistrationsVersion(version => version + 1);
    setSuccess('Registration approved. QR ticket is now available to the participant.');
  };

  const reject = (registration: Registration) => {
    setSuccess('');
    setError('');
    if (!organizer || !ownsEvent) {
      setError('Only the organizer who owns this event can reject registrations.');
      return;
    }
    const reason = window.prompt('Reason for rejection?')?.trim();
    if (!reason) {
      setError('Rejection reason is required.');
      return;
    }
    store.rejectRegistration(registration.id, organizer.id, reason);
    setRegistrationsVersion(version => version + 1);
    setSuccess('Registration rejected.');
  };

  return (
    <DashboardLayout title="Registrations">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-white/40">{registrations.length} application{registrations.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-white/25 mt-1">QR tickets are generated only after approval.</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle className="w-3 h-3" /> {registrations.filter(r => r.status === 'attended').length} checked in
        </div>
      </div>

      {(success || error) && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
          {success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {success || error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(filter => {
          const count = registrations.filter(registration => registration.status === filter.value).length;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                activeFilter === filter.value ? 'bg-[#E49B3A] text-black' : 'bg-white/5 text-white/45 hover:text-white'
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>

      {filteredRegistrations.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><p className="text-sm text-white/30">No {activeFilter} registrations</p></div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map((reg) => (
            <div key={reg.id} className="glass-card rounded-xl p-4">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[#E49B3A]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-[#E49B3A]">{reg.participant?.full_name?.[0] || '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{reg.participant?.full_name || 'Unknown participant'}</p>
                    <p className="text-[10px] text-white/30">{reg.participant?.email || reg.participant?.username || 'No email available'}</p>
                    <p className="text-[10px] text-white/25 mt-1">Submitted {new Date(reg.registered_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusClasses(reg.status)}`}>{reg.status}</span>
                  {reg.registration_code && <span className="mono-text text-[10px] text-[#E49B3A] bg-white/5 rounded px-2 py-1">{reg.registration_code}</span>}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <p className="text-xs font-semibold text-white/60 mb-2">Submitted answers</p>
                {Object.keys(reg.form_answers || {}).length === 0 ? (
                  <p className="text-xs text-white/25">No form answers saved.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {Object.entries(reg.form_answers || {}).map(([label, answer]) => (
                      <div key={label}>
                        <p className="text-[10px] text-white/30">{label}</p>
                        <p className="text-xs text-white/70 break-words">{Array.isArray(answer) ? answer.join(', ') : String(answer || '-')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reg.status === 'rejected' && reg.rejection_reason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-200">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {reg.rejection_reason}
                </div>
              )}

              {reg.status === 'pending' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => approve(reg)} className="gold-btn text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => reject(reg)} className="ghost-btn text-xs rounded-full flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-white/25 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        Pending applications do not have QR codes and cannot be checked in.
      </div>
    </DashboardLayout>
  );
}
