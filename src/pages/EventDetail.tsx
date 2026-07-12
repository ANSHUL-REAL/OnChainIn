import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { EventPoster } from '@/components/EventPoster';
import { EventLocationMap } from '@/components/EventLocationMap';
import store from '@/data/store';
import { demoUsers, useAuth } from '@/hooks/useAuth';
import { useSyncedEventBySlug } from '@/hooks/useSyncedEvents';
import { eventStatusBadgeClass, getEventDisplayStatus, isPastEvent } from '@/lib/eventLifecycle';
import { Calendar, MapPin, Clock, ArrowLeft, CheckCircle, AlertCircle, FileText, Handshake, HeartHandshake } from 'lucide-react';
import type { Profile, UserRole } from '@/types';

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useSyncedEventBySlug(slug || '');
  const { user, continueAs } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [, refreshActions] = useState(0);

  const formFields = useMemo(() => event ? store.getEventFormFields(event.id) : [], [event]);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <p className="text-white/40">Event not found</p>
      </div>
    );
  }

  const registrations = store.getEventRegistrations(event.id);
  const participantId = user?.role === 'participant' ? user.id : demoUsers.participant.id;
  const volunteerId = user?.role === 'volunteer' ? user.id : demoUsers.volunteer.id;
  const sponsorId = user?.role === 'sponsor' ? user.id : demoUsers.sponsor.id;
  const existingReg = registrations.find(r => r.participant_id === participantId);
  const existingVolunteerApp = store.getVolunteerApplicationsByUser(volunteerId).find(app => app.event_id === event.id);
  const existingSponsorInterest = store.getSponsorInterestsBySponsor(sponsorId).find(interest => interest.event_id === event.id);
  const approvedCount = registrations.filter(reg => reg.status === 'approved' || reg.status === 'attended').length;
  const displayStatus = getEventDisplayStatus(event);
  const ended = isPastEvent(event.date);

  const ensureRole = (role: UserRole): Profile | null => {
    if (!user) {
      setError('Please login first so OnChainIn can create your own saved QR, proof, and application records.');
      navigate(`/login?role=${role}`);
      return null;
    }
    if (user.role === role) return user;
    const switched = continueAs(role);
    if (!switched) {
      navigate(`/login?role=${role}`);
      return null;
    }
    return switched;
  };

  const handleOpenForm = () => {
    const participant = ensureRole('participant');
    if (!participant) return;
    setShowForm(true);
    setError('');
    setActionMessage('Switched to Participant workspace for this application.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    for (const field of formFields) {
      const value = answers[field.id];
      if (field.required && (value === undefined || value === '' || value === false)) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    const participant = ensureRole('participant');
    if (!participant) return;

    try {
      store.createRegistration({
        event_id: event.id,
        participant_id: participant.id,
        registration_code: null,
        status: 'pending',
        form_answers: Object.fromEntries(formFields.map(field => [field.label, answers[field.id] ?? ''])),
      });
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  const handleVolunteerApply = () => {
    setError('');
    setActionMessage('');
    if (ended) {
      setError('Volunteer applications are closed because this event has ended.');
      return;
    }
    const volunteer = ensureRole('volunteer');
    if (!volunteer) return;

    if (store.getVolunteerApplicationsByUser(volunteer.id).some(app => app.event_id === event.id)) {
      setActionMessage('You already submitted a volunteer application for this event.');
      return;
    }

    navigate('/dashboard/volunteer/applications');
  };

  const handleSponsorInterest = () => {
    setError('');
    setActionMessage('');
    if (ended) {
      setError('Sponsor interest is closed because this event has ended.');
      return;
    }
    const sponsor = ensureRole('sponsor');
    if (!sponsor) return;

    if (store.getSponsorInterestsBySponsor(sponsor.id).some(interest => interest.event_id === event.id)) {
      setActionMessage('Sponsor interest already submitted for this event.');
      return;
    }

    try {
      store.createSponsorInterest({
        event_id: event.id,
        sponsor_id: sponsor.id,
        package_id: undefined,
        company_name: sponsor.full_name || 'Sponsor Partner',
        message: `Interested in sponsoring ${event.title}.`,
        status: 'new',
      });
      setActionMessage('Sponsor interest submitted. The organizer can now review it.');
      refreshActions(value => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sponsor interest failed.');
    }
  };

  const renderVolunteerState = () => {
    if (existingVolunteerApp) {
      return (
        <div className="rounded-xl border border-[#D9D0B8] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-black text-[#14150F]">Volunteer</p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-[#52670F] capitalize">{existingVolunteerApp.status}</span>
          </div>
          <p className="text-xs text-[#5E6256]">Role: {existingVolunteerApp.role_requested || 'Event Support'}</p>
          <button onClick={() => navigate('/dashboard/volunteer/applications')} className="ghost-btn w-full text-xs rounded-full mt-3">
            View Volunteer Applications
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[#D9D0B8] bg-white/60 p-4">
        <div className="w-10 h-10 rounded-full bg-[#52670F]/10 flex items-center justify-center mb-3">
          <HeartHandshake className="w-5 h-5 text-[#52670F]" />
        </div>
        <p className="text-sm font-black text-[#14150F] mb-1">Volunteer for this event</p>
        <p className="text-xs text-[#5E6256] mb-3">Submit a volunteer application and let the organizer approve your role.</p>
        <button onClick={handleVolunteerApply} disabled={ended} className="ghost-btn w-full text-xs rounded-full disabled:opacity-50">
          Apply as Volunteer
        </button>
      </div>
    );
  };

  const renderSponsorState = () => {
    if (existingSponsorInterest) {
      return (
        <div className="rounded-xl border border-[#D9D0B8] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-black text-[#14150F]">Sponsor</p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 capitalize">{existingSponsorInterest.status}</span>
          </div>
          <p className="text-xs text-[#5E6256]">Your sponsor interest has been sent to the organizer.</p>
          <button onClick={() => navigate('/dashboard/sponsor/interests')} className="ghost-btn w-full text-xs rounded-full mt-3">
            View Sponsor Interests
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[#D9D0B8] bg-white/60 p-4">
        <div className="w-10 h-10 rounded-full bg-[#E49B3A]/10 flex items-center justify-center mb-3">
          <Handshake className="w-5 h-5 text-[#A76A19]" />
        </div>
        <p className="text-sm font-black text-[#14150F] mb-1">Sponsor this event</p>
        <p className="text-xs text-[#5E6256] mb-3">Send sponsor interest so the organizer can contact you.</p>
        <button onClick={handleSponsorInterest} disabled={ended} className="ghost-btn w-full text-xs rounded-full disabled:opacity-50">
          Submit Sponsor Interest
        </button>
      </div>
    );
  };

  const renderRegistrationState = () => {
    const registration = existingReg || (submitted ? { status: 'pending' as const } : null);

    if (ended) {
      return (
        <div className="text-center">
          <span className={`inline-flex text-xs px-3 py-1 rounded-full border mb-3 ${eventStatusBadgeClass(displayStatus)}`}>Event Ended</span>
          <p className="text-sm font-black text-[#14150F] mb-2">Registration Closed</p>
          <p className="text-xs text-[#5E6256] mb-4">Registration is closed because this event has already ended.</p>
          {existingReg && (
            <button onClick={() => navigate('/dashboard/participant/tickets')} className="ghost-btn w-full text-xs rounded-full">
              View My Tickets
            </button>
          )}
        </div>
      );
    }

    if (!registration) {
      return (
        <>
          {error && <p className="mb-3 text-xs text-red-600 text-center">{error}</p>}
          <button onClick={handleOpenForm} className="w-full gold-btn mb-3">
            Apply for Event
          </button>
          <p className="text-[10px] text-center text-[#5E6256]">Approval required before ticket issue</p>
        </>
      );
    }

    if (registration.status === 'pending') {
      return (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8 text-amber-300" />
          </div>
          <p className="text-sm font-black text-[#A06D11] mb-1">Registration Submitted</p>
          <p className="text-xs text-[#5E6256] mb-4">Waiting for organizer approval.</p>
          <button onClick={() => navigate('/dashboard/participant/tickets')} className="ghost-btn w-full text-xs rounded-full">
            View My Tickets
          </button>
        </div>
      );
    }

    if (registration.status === 'rejected') {
      return (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-red-300" />
          </div>
          <p className="text-sm font-black text-red-600 mb-1">Registration Rejected</p>
          <p className="text-xs text-[#5E6256] mb-4">{'rejection_reason' in registration && registration.rejection_reason ? registration.rejection_reason : 'The organizer did not approve this application.'}</p>
          <button onClick={() => navigate('/dashboard/participant/tickets')} className="ghost-btn w-full text-xs rounded-full">
            View My Tickets
          </button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-sm font-black text-emerald-700 mb-1">
          {registration.status === 'attended' ? 'Attendance Verified' : 'Registration Approved'}
        </p>
        <p className="text-xs text-[#5E6256] mb-3">Your QR ticket is ready.</p>
        <div className="mono-text text-sm bg-[#F6FAE8] rounded-xl py-2 px-3 text-[#E49B3A] mb-4">
          {'registration_code' in registration ? registration.registration_code : ''}
        </div>
        <button onClick={() => navigate('/dashboard/participant/tickets')} className="ghost-btn w-full text-xs rounded-full">
          View My Tickets
        </button>
      </div>
    );
  };

  return (
    <div className="eventos-light-app min-h-screen bg-[#F9F8F1] text-[#14150F]">
      <Navbar />
      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-sm font-bold text-[#52670F] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventPoster event={event} variant="banner" className="w-full rounded-xl aspect-video mb-6" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E49B3A]/10 text-[#E49B3A] font-medium">{event.category}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${eventStatusBadgeClass(displayStatus)}`}>{displayStatus}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#14150F] mt-3 mb-4">{event.title}</h1>
            <p className="text-sm text-[#5E6256] leading-relaxed mb-6">{event.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl border border-[#DCE8BE] bg-white/80 p-4 shadow-[0_12px_36px_rgba(46,36,16,0.06)]">
                <Calendar className="w-4 h-4 text-[#52670F] mb-2" />
                <p className="text-xs text-[#5E6256]">Date</p>
                <p className="text-sm font-bold text-[#14150F]">{event.date}</p>
              </div>
              <div className="rounded-2xl border border-[#DCE8BE] bg-white/80 p-4 shadow-[0_12px_36px_rgba(46,36,16,0.06)]">
                <Clock className="w-4 h-4 text-[#52670F] mb-2" />
                <p className="text-xs text-[#5E6256]">Time</p>
                <p className="text-sm font-bold text-[#14150F]">{event.start_time} - {event.end_time}</p>
              </div>
              <div className="rounded-2xl border border-[#DCE8BE] bg-white/80 p-4 shadow-[0_12px_36px_rgba(46,36,16,0.06)]">
                <MapPin className="w-4 h-4 text-[#52670F] mb-2" />
                <p className="text-xs text-[#5E6256]">Venue</p>
                <p className="text-sm font-bold text-[#14150F]">{event.venue || 'To be announced'}</p>
              </div>
              <div className="rounded-2xl border border-[#DCE8BE] bg-white/80 p-4 shadow-[0_12px_36px_rgba(46,36,16,0.06)]">
                <MapPin className="w-4 h-4 text-[#52670F] mb-2" />
                <p className="text-xs text-[#5E6256]">City</p>
                <p className="text-sm font-bold text-[#14150F]">{event.city || 'City TBA'}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded-[28px] border border-[#D9D0B8] bg-white/90 p-5 shadow-[0_24px_80px_rgba(46,36,16,0.12)] backdrop-blur-xl">
              {actionMessage && <p className="mb-3 text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-lg p-3">{actionMessage}</p>}
              {error && <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#5E6256]">Approved Tickets</span>
                <span className="text-xs font-bold text-[#5E6256]">{approvedCount} / {event.max_participants}</span>
              </div>
              <div className="w-full bg-[#EEF5D9] rounded-full h-2 mb-6 overflow-hidden">
                <div className="bg-[#E49B3A] h-1.5 rounded-full" style={{ width: `${Math.min((approvedCount / event.max_participants) * 100, 100)}%` }} />
              </div>

              {renderRegistrationState()}
              <div className="mt-5 space-y-4">
                {renderVolunteerState()}
                {renderSponsorState()}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <EventLocationMap event={event} />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg max-h-[86vh] overflow-y-auto glass-card rounded-xl p-6">
            <div className="mb-5">
              <p className="text-lg font-semibold text-white">Submit Registration</p>
              <p className="text-xs text-white/35 mt-1">Your application will stay pending until the organizer approves it.</p>
            </div>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.id}>
                  <label className="text-xs text-white/50 mb-1.5 block">
                    {field.label}{field.required && <span className="text-[#E49B3A]"> *</span>}
                  </label>
                  {field.field_type === 'textarea' ? (
                    <textarea value={String(answers[field.id] || '')} onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50 resize-none" />
                  ) : field.field_type === 'select' ? (
                    <select value={String(answers[field.id] || '')} onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50">
                      <option value="" className="bg-[#1a1a1a]">Select...</option>
                      {field.options.map(option => <option key={option} value={option} className="bg-[#1a1a1a]">{option}</option>)}
                    </select>
                  ) : field.field_type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-white/60">
                      <input type="checkbox" checked={Boolean(answers[field.id])} onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.checked }))} />
                      Yes
                    </label>
                  ) : (
                    <input type={field.field_type === 'phone' ? 'tel' : field.field_type} value={String(answers[field.id] || '')} onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-5 flex gap-3">
              <button type="submit" className="gold-btn text-sm">Submit Registration</button>
              <button type="button" onClick={() => setShowForm(false)} className="ghost-btn text-sm rounded-full">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}
