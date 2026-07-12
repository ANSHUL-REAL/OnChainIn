import store from '@/data/store';
import type { Attendance, Certificate, Event, Profile, Registration, VolunteerTask } from '@/types';

export type ParticipantProof = {
  registration: Registration;
  participant?: Profile;
  event?: Event;
  organizer?: Profile;
  attendance?: Attendance;
  certificate?: Certificate;
  proofId: string;
  verified: boolean;
};

export type VolunteerProof = {
  volunteer?: Profile;
  tasks: VolunteerTask[];
  completedTasks: VolunteerTask[];
  hours: number;
  skills: string[];
  checkInsHandled: number;
  points: number;
  badges: string[];
  events: Event[];
  verified: boolean;
};

export type SponsorImpact = {
  event: Event;
  totalRegistrations: number;
  checkedInAttendees: number;
  approvedAttendees: number;
  audienceType: string;
  visibilityBenefits: string[];
  engagementProof: string[];
  sponsorLeads: number;
  confirmedSponsors: number;
  reachScore: number;
};

function latestFirst<T extends { registered_at?: string; checked_in_at?: string; issued_at?: string; created_at?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.checked_in_at || a.issued_at || a.registered_at || a.created_at || '';
    const bTime = b.checked_in_at || b.issued_at || b.registered_at || b.created_at || '';
    return bTime.localeCompare(aTime);
  });
}

export function getParticipantProof(id: string): ParticipantProof | null {
  const registrations = store.getRegistrations();
  const registration =
    registrations.find(reg => reg.id === id)
    || registrations.find(reg => reg.registration_code === id)
    || latestFirst(registrations.filter(reg => reg.participant_id === id && reg.status === 'attended'))[0]
    || latestFirst(registrations.filter(reg => reg.participant_id === id))[0];

  if (!registration) return null;

  const event = store.getEventById(registration.event_id);
  const participant = store.getProfileById(registration.participant_id);
  const organizer = event ? store.getProfileById(event.organizer_id) : undefined;
  const attendance = store.getAttendance().find(row => row.registration_id === registration.id)
    || (registration.status === 'attended'
      ? {
          id: `derived-${registration.id}`,
          event_id: registration.event_id,
          registration_id: registration.id,
          participant_id: registration.participant_id,
          checked_in_by: registration.reviewed_by || event?.organizer_id,
          checked_in_at: registration.reviewed_at || registration.registered_at,
          status: 'present' as const,
        }
      : undefined);
  const certificate = store.getCertificates().find(cert => cert.event_id === registration.event_id && cert.user_id === registration.participant_id);
  const proofId = registration.registration_code || `PROOF-${registration.id.slice(0, 8).toUpperCase()}`;

  return {
    registration,
    participant,
    event,
    organizer,
    attendance,
    certificate,
    proofId,
    verified: registration.status === 'attended' && Boolean(attendance),
  };
}

export function getVolunteerProof(id: string): VolunteerProof | null {
  const volunteer = store.getProfileById(id) || store.getProfileByUsername(id);
  const volunteerId = volunteer?.id || id;
  const tasks = store.getVolunteerTasksByUser(volunteerId);
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const hours = completedTasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  const skills = Array.from(new Set(completedTasks.flatMap(task => task.skills_earned || task.skills_gained || [])));
  const checkInsHandled = store.getAttendance().filter(row => row.checked_in_by === volunteerId).length;
  const leaderboardRow = store.getVolunteerLeaderboard().find(row => row.user_id === volunteerId);
  const points = leaderboardRow?.points || 0;
  const badges = leaderboardRow?.badges || [];
  const events = Array.from(new Map(tasks.map(task => [task.event_id, task.event]).filter((entry): entry is [string, Event] => Boolean(entry[1]))).values());

  if (!volunteer && tasks.length === 0 && checkInsHandled === 0) return null;

  return {
    volunteer,
    tasks,
    completedTasks,
    hours,
    skills,
    checkInsHandled,
    points,
    badges,
    events,
    verified: completedTasks.length > 0 || checkInsHandled > 0,
  };
}

export function getSponsorImpact(eventId: string): SponsorImpact | null {
  const event = store.getEventById(eventId);
  if (!event) return null;

  const registrations = store.getEventRegistrations(event.id);
  const checkedInAttendees = registrations.filter(reg => reg.status === 'attended').length;
  const approvedAttendees = registrations.filter(reg => reg.status === 'approved' || reg.status === 'attended').length;
  const packages = store.getEventSponsorPackages(event.id);
  const interests = store.getEventSponsorInterests(event.id);
  const confirmedSponsors = interests.filter(interest => interest.status === 'confirmed').length;
  const packageBenefits = packages.flatMap(pkg => pkg.benefits || []);
  const visibilityBenefits = packageBenefits.length > 0
    ? Array.from(new Set(packageBenefits)).slice(0, 5)
    : ['Event page visibility', 'Audience category fit', 'Organizer follow-up report'];
  const engagementProof = [
    `${registrations.length} registration${registrations.length === 1 ? '' : 's'} captured`,
    `${checkedInAttendees} verified check-in${checkedInAttendees === 1 ? '' : 's'}`,
    `${approvedAttendees} approved attendee${approvedAttendees === 1 ? '' : 's'}`,
    `${interests.length} sponsor lead${interests.length === 1 ? '' : 's'} recorded`,
  ];

  return {
    event,
    totalRegistrations: registrations.length,
    checkedInAttendees,
    approvedAttendees,
    audienceType: event.category || 'Event audience',
    visibilityBenefits,
    engagementProof,
    sponsorLeads: interests.length,
    confirmedSponsors,
    reachScore: Math.min(100, Math.round(((checkedInAttendees || approvedAttendees || registrations.length) / Math.max(event.max_participants || 1, 1)) * 100)),
  };
}
