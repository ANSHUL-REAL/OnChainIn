import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventPoster } from '@/components/EventPoster';
import store from '@/data/store';
import { useSyncedPublishedEvents } from '@/hooks/useSyncedEvents';
import { Calendar, CheckCircle, HeartHandshake, MapPin, Target, X } from 'lucide-react';
import type { Event, VolunteerRole } from '@/types';

const defaultVolunteerRoles: Omit<VolunteerRole, 'id' | 'event_id'>[] = [
  {
    role_name: 'Registration Desk',
    description: 'Welcome attendees, verify names, guide QR ticket flow, and support entry queues.',
    required_count: 4,
    skills: ['Communication', 'Check-in', 'Crowd support'],
  },
  {
    role_name: 'QR Check-in Support',
    description: 'Help the organizer scan tickets, resolve manual code issues, and reduce entry delays.',
    required_count: 3,
    skills: ['QR scanning', 'Fast coordination'],
  },
  {
    role_name: 'Stage / Room Coordination',
    description: 'Keep sessions on time, guide speakers, and manage room movement during the event.',
    required_count: 2,
    skills: ['Coordination', 'Time management'],
  },
  {
    role_name: 'Technical Support',
    description: 'Support projectors, audio, internet, workshop setup, and participant technical issues.',
    required_count: 2,
    skills: ['Tech support', 'Troubleshooting'],
  },
  {
    role_name: 'Social Media / Content',
    description: 'Capture moments, post updates, and help the event build online visibility.',
    required_count: 2,
    skills: ['Content', 'Photography'],
  },
  {
    role_name: 'Sponsor & Guest Helpdesk',
    description: 'Guide sponsors, guests, and partners to the right desk, booth, or session room.',
    required_count: 1,
    skills: ['Hospitality', 'Partner support'],
  },
];

function statusClass(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function rolesForEvent(eventId: string): VolunteerRole[] {
  const configured = store.getEventVolunteerRoles(eventId);
  if (configured.length > 0) return configured;

  return defaultVolunteerRoles.map((role, index) => ({
    ...role,
    id: `suggested-${eventId}-${index}`,
    event_id: eventId,
  }));
}

function roleKey(roleName?: string) {
  return (roleName || 'General Volunteer').trim().toLowerCase();
}

export default function VolunteerApplications() {
  const user = store.getCurrentUser();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [roleRequested, setRoleRequested] = useState('Registration Desk');
  const [skills, setSkills] = useState('');
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState('');
  const [preferredTaskPlace, setPreferredTaskPlace] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const events = useSyncedPublishedEvents();
  const applications = user ? store.getVolunteerApplicationsByUser(user.id) : [];

  const openApply = (event: Event, roleName = 'Registration Desk') => {
    setSelectedEvent(event);
    setRoleRequested(roleName);
    setSkills('');
    setReason('');
    setAvailability('');
    setPreferredTaskPlace('');
    setMessage('');
    setError('');
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!user || !selectedEvent) return;

    try {
      store.createVolunteerApplication({
        event_id: selectedEvent.id,
        volunteer_id: user.id,
        role_requested: roleRequested.trim(),
        skills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
        reason,
        availability,
        preferred_task_place: preferredTaskPlace,
        status: 'pending',
      });
      setSelectedEvent(null);
      setVersion(version + 1);
      setMessage('Volunteer application submitted. Waiting for organizer approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Volunteer application failed.');
    }
  };

  return (
    <DashboardLayout title="Volunteer Applications">
      {message && (
        <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#55720e] font-black">Volunteer matching</p>
          <h2 className="text-2xl font-black text-[#11130d]">Pick the exact role you can handle.</h2>
          <p className="text-sm text-[#62665a] max-w-2xl">
            OnChainIn evaluates each event's volunteer requirement, open slots, and preferred task areas so you can apply where you actually want to help.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[28px] border border-[#ded7c4] bg-white p-8 text-center shadow-[0_18px_60px_rgba(46,36,16,0.08)]">
            <HeartHandshake className="w-12 h-12 text-[#55720e]/20 mx-auto mb-3" />
            <p className="text-sm text-[#62665a]">No volunteer opportunities available yet.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {events.map((event) => {
              const eventRoles = rolesForEvent(event.id);
              const eventApps = store.getEventVolunteerApplications(event.id);
              const myEventApps = applications.filter(app => app.event_id === event.id);
              const totalRequired = eventRoles.reduce((sum, role) => sum + role.required_count, 0);
              const totalApproved = eventApps.filter(app => app.status === 'approved').length;
              const totalOpen = Math.max(totalRequired - totalApproved, 0);

              return (
                <div key={event.id} className="rounded-[30px] border border-[#ded7c4] bg-white/95 p-4 shadow-[0_24px_80px_rgba(46,36,16,0.08)]">
                  <div className="flex flex-col lg:flex-row gap-5">
                    <EventPoster event={event} className="w-full lg:w-64 h-40 rounded-[22px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#f6ead2] text-[#b46c05]">{event.category}</span>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#eef7d7] text-[#55720e]">{totalOpen} open volunteer slots</span>
                      </div>
                      <h3 className="text-2xl font-black text-[#11130d] mt-2">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#62665a] mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.venue || event.city || 'Venue TBA'}</span>
                        <span>{store.getProfileById(event.organizer_id)?.full_name || 'Organizer'}</span>
                      </div>

                      {myEventApps.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {myEventApps.map(app => (
                            <span key={app.id} className={`text-[10px] px-2.5 py-1 rounded-full border capitalize ${statusClass(app.status)}`}>
                              {app.role_requested}: {app.status}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {eventRoles.map((role) => {
                      const approved = eventApps.filter(app => app.status === 'approved' && roleKey(app.role_requested || app.role?.role_name) === roleKey(role.role_name)).length;
                      const pending = eventApps.filter(app => app.status === 'pending' && roleKey(app.role_requested || app.role?.role_name) === roleKey(role.role_name)).length;
                      const openSlots = Math.max(role.required_count - approved, 0);
                      const alreadyApplied = applications.some(app => app.event_id === event.id && roleKey(app.role_requested) === roleKey(role.role_name));

                      return (
                        <div key={role.id} className="rounded-[22px] border border-[#e4ddca] bg-[#fbfaf2] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-[#11130d]">{role.role_name}</p>
                              <p className="text-xs text-[#62665a] mt-1 line-clamp-2">{role.description}</p>
                            </div>
                            <Target className="w-4 h-4 text-[#55720e] flex-shrink-0" />
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-white border border-[#e4ddca] p-2">
                              <p className="text-base font-black text-[#11130d]">{role.required_count}</p>
                              <p className="text-[9px] text-[#62665a]">needed</p>
                            </div>
                            <div className="rounded-xl bg-white border border-[#e4ddca] p-2">
                              <p className="text-base font-black text-[#55720e]">{approved}</p>
                              <p className="text-[9px] text-[#62665a]">approved</p>
                            </div>
                            <div className="rounded-xl bg-white border border-[#e4ddca] p-2">
                              <p className="text-base font-black text-[#b46c05]">{pending}</p>
                              <p className="text-[9px] text-[#62665a]">pending</p>
                            </div>
                          </div>

                          {(role.skills || []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {role.skills?.map(skill => (
                                <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-[#edf5d8] text-[#55720e]">{skill}</span>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => openApply(event, role.role_name)}
                            disabled={alreadyApplied || openSlots === 0}
                            className="mt-4 w-full rounded-full bg-[#55720e] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#425909] disabled:cursor-not-allowed disabled:bg-[#d8d3c5] disabled:text-[#77736a]"
                          >
                            {alreadyApplied ? 'Already applied' : openSlots === 0 ? 'Role filled' : `Apply for this role (${openSlots} open)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-black text-[#11130d] mb-3">My Applications</h2>
        {applications.length === 0 ? (
          <div className="rounded-[28px] border border-[#ded7c4] bg-white p-8 text-center shadow-[0_18px_60px_rgba(46,36,16,0.08)]">
            <HeartHandshake className="w-12 h-12 text-[#55720e]/20 mx-auto mb-3" />
            <p className="text-sm text-[#62665a]">No volunteer applications yet. Choose an event role above to apply.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {applications.map((application) => {
              const event = store.getEventById(application.event_id);
              return (
                <div key={application.id} className="rounded-[24px] border border-[#ded7c4] bg-white p-4 shadow-[0_14px_40px_rgba(46,36,16,0.06)]">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#eef7d7] flex items-center justify-center flex-shrink-0">
                      <HeartHandshake className="w-5 h-5 text-[#55720e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#11130d] truncate">{event?.title || 'Volunteer application'}</p>
                      <p className="text-xs text-[#62665a] mt-1">{application.role_requested}</p>
                      {application.preferred_task_place && (
                        <p className="text-xs text-[#62665a] mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Preferred: {application.preferred_task_place}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Calendar className="w-3 h-3 text-[#55720e]" />
                        <span className="text-[10px] text-[#62665a]">{new Date(application.applied_at).toLocaleDateString()}</span>
                      </div>
                      {(application.skills || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {application.skills?.map(skill => <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-[#edf5d8] text-[#55720e]">{skill}</span>)}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${statusClass(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedEvent && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <form onSubmit={submitApplication} className="w-full max-w-lg rounded-[30px] border border-[#ded7c4] bg-[#fffdf6] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-2xl font-black text-[#11130d]">Apply as Volunteer</p>
                <p className="text-sm text-[#62665a] mt-1">{selectedEvent.title}</p>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} className="text-[#62665a] hover:text-[#11130d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#55720e] mb-1.5 block">Role requested</label>
                <select value={roleRequested} onChange={e => setRoleRequested(e.target.value)} required
                  className="w-full bg-white border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] focus:outline-none focus:border-[#55720e]">
                  {rolesForEvent(selectedEvent.id).map(role => (
                    <option key={role.id} value={role.role_name}>{role.role_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#55720e] mb-1.5 block">Preferred task/place</label>
                <input value={preferredTaskPlace} onChange={e => setPreferredTaskPlace(e.target.value)} placeholder="Entry gate, registration desk, stage area, sponsor desk"
                  className="w-full bg-white border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#55720e] mb-1.5 block">Skills</label>
                <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Communication, Logistics, Design"
                  className="w-full bg-white border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#55720e] mb-1.5 block">Why do you want to volunteer?</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                  className="w-full bg-white border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] focus:outline-none focus:border-[#55720e] resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#55720e] mb-1.5 block">Availability / preferred time</label>
                <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Morning, full day, 2 PM - 6 PM"
                  className="w-full bg-white border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row gap-3">
              <button type="submit" className="rounded-full bg-[#55720e] px-5 py-3 text-sm font-black text-white hover:bg-[#425909]">Submit Application</button>
              <button type="button" onClick={() => setSelectedEvent(null)} className="rounded-full border border-[#ccd6a7] px-5 py-3 text-sm font-black text-[#55720e] hover:bg-[#eef7d7]">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
