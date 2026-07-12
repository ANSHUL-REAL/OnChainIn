import type {
  Profile, Event, Registration, VolunteerApplication, VolunteerTask,
  SponsorPackage, SponsorInterest, BudgetItem, Certificate, PassportRecord, VolunteerRole, EventFormField, Attendance,
  VolunteerProfile, VolunteerPointsEntry, LeaderboardEntry, WinnerSelfie, EventWinner, EventPrizePool
} from '@/types';
import { pushRemote, pullRemote } from '@/lib/persistence';
import {
  clearSession,
  profileFromSession,
  readSession,
  writeSession,
  isUserRole,
  type SessionUser,
} from '@/lib/session';
import {
  seedProfiles, seedEvents, seedRegistrations, seedVolunteerApplications,
  seedVolunteerTasks, seedSponsorPackages, seedSponsorInterests,
  seedBudgetItems, seedCertificates, seedPassportRecords, seedVolunteerRoles
} from './seedData';
import { isActivePublishedEvent, isPastEvent, sortPastEvents, sortUpcomingEvents } from '@/lib/eventLifecycle';

const STORAGE_KEYS = {
  // v2 = clean identity (no EventOS "Sourab" seed identity)
  profiles: 'OnChainIn_profiles_v2',
  events: 'OnChainIn_events_v2',
  registrations: 'OnChainIn_registrations_v2',
  attendance: 'OnChainIn_attendance_v2',
  eventFormFields: 'OnChainIn_event_form_fields_v2',
  volunteerRoles: 'OnChainIn_volunteer_roles_v2',
  volunteerApplications: 'OnChainIn_volunteer_applications_v2',
  volunteerTasks: 'OnChainIn_volunteer_tasks_v2',
  sponsorPackages: 'OnChainIn_sponsor_packages_v2',
  sponsorInterests: 'OnChainIn_sponsor_interests_v2',
  budgetItems: 'OnChainIn_budget_items_v2',
  certificates: 'OnChainIn_certificates_v2',
  passportRecords: 'OnChainIn_passport_records_v2',
  winnerSelfies: 'OnChainIn_winner_selfies_v2',
  eventWinners: 'OnChainIn_event_winners_v2',
  prizePools: 'OnChainIn_prize_pools_v2',
  currentUser: 'OnChainIn_current_user_v2',
  volunteerProfiles: 'OnChainIn_volunteer_profiles_v2',
  volunteerPoints: 'OnChainIn_volunteer_points_v2',
};

// Points awarded per volunteer action (feature 6 — gamified leaderboard).
export const POINTS = {
  taskCompleted: 50,
  perHour: 10,
  checkInHandled: 15,
};

type DemoUser = SessionUser;

const DEMO_PROFILES: Profile[] = [
  { id: 'demo-organizer', full_name: 'Organizer', username: 'organizer', email: '', role: 'organizer', avatar_url: '', bio: '', passport_slug: 'organizer', created_at: '' },
  { id: 'demo-participant', full_name: 'Participant', username: 'participant', email: '', role: 'participant', avatar_url: '', bio: '', passport_slug: 'participant', created_at: '' },
  { id: 'demo-volunteer', full_name: 'Volunteer', username: 'volunteer', email: '', role: 'volunteer', avatar_url: '', bio: '', passport_slug: 'volunteer', created_at: '' },
  { id: 'demo-sponsor', full_name: 'Sponsor', username: 'sponsor', email: '', role: 'sponsor', avatar_url: '', bio: '', passport_slug: 'sponsor', created_at: '' },
];

const DEMO_DATA_ALIASES: Record<string, string[]> = {
  'demo-organizer': ['u2', 'u8'],
  'demo-participant': ['u1'],
  'demo-volunteer': ['u3', 'u7'],
  'demo-sponsor': ['u5'],
};

function relatedProfileIds(id: string): string[] {
  return Array.from(new Set([id, ...(DEMO_DATA_ALIASES[id] || [])]));
}

function isRelatedProfileId(candidateId: string | undefined | null, ownerId: string) {
  return Boolean(candidateId && relatedProfileIds(ownerId).includes(candidateId));
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function setItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
  // Multi-user: push this collection to Supabase when configured
  try {
    // Lazy import path avoided — notify via dynamic to keep store sync
    void import('@/lib/cloudSync').then((m) => m.notifyLocalWrite(key));
  } catch {
    /* offline / circular */
  }
}

function seedIfMissingOrEmpty<T>(key: string, seed: T) {
  const existing = localStorage.getItem(key);
  if (!existing) {
    setItem(key, seed);
    return;
  }

  try {
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(seed) && seed.length > 0) {
      setItem(key, seed);
    }
  } catch {
    setItem(key, seed);
  }
}

function migrateSeedEventDates() {
  const events = getItem<Event[]>(STORAGE_KEYS.events, []);
  let changed = false;
  const migrated = events.map(event => {
    if (event.id === 'e1' && event.date === '2026-03-15') {
      changed = true;
      return { ...event, date: '2026-06-10' };
    }
    if (event.id === 'e2' && event.date === '2026-04-22') {
      changed = true;
      return { ...event, date: '2026-06-28' };
    }
    return event;
  });
  if (changed) setItem(STORAGE_KEYS.events, migrated);
}

function ensureSeedRows<T extends { id: string }>(key: string, seedRows: T[], options?: { updateIds?: string[] }) {
  const existing = getItem<T[]>(key, []);
  const byId = new Map(existing.map(row => [row.id, row]));
  let changed = false;

  seedRows.forEach((seedRow) => {
    if (!byId.has(seedRow.id)) {
      byId.set(seedRow.id, seedRow);
      changed = true;
      return;
    }

    if (options?.updateIds?.includes(seedRow.id)) {
      byId.set(seedRow.id, { ...byId.get(seedRow.id), ...seedRow });
      changed = true;
    }
  });

  if (changed) setItem(key, Array.from(byId.values()));
}

function ensureCreatedShowcaseEvents() {
  const showcaseEventIds = [
    'e1',
    'e2',
    'e3',
    'manual-pubg-arena-2026',
    'manual-ai-builders-2026',
    'manual-startup-night-2026',
  ];
  const showcaseRoleIds = ['vr-pubg-1', 'vr-pubg-2', 'vr-ai-builders-1', 'vr-startup-night-1'];
  const showcasePackageIds = ['sp-pubg-1', 'sp-pubg-2', 'sp-ai-builders-1', 'sp-startup-night-1'];
  const showcaseBudgetIds = [
    'b-pubg-1',
    'b-pubg-2',
    'b-pubg-3',
    'b-ai-builders-1',
    'b-ai-builders-2',
    'b-ai-builders-3',
    'b-startup-1',
    'b-startup-2',
    'b-startup-3',
  ];

  ensureSeedRows(STORAGE_KEYS.events, seedEvents, { updateIds: showcaseEventIds });
  ensureSeedRows(STORAGE_KEYS.volunteerRoles, seedVolunteerRoles, { updateIds: showcaseRoleIds });
  ensureSeedRows(STORAGE_KEYS.sponsorPackages, seedSponsorPackages, { updateIds: showcasePackageIds });
  ensureSeedRows(STORAGE_KEYS.budgetItems, seedBudgetItems, { updateIds: showcaseBudgetIds });
}

function initStore() {
  seedIfMissingOrEmpty(STORAGE_KEYS.profiles, seedProfiles);
  seedIfMissingOrEmpty(STORAGE_KEYS.events, seedEvents);
  seedIfMissingOrEmpty(STORAGE_KEYS.registrations, seedRegistrations);
  seedIfMissingOrEmpty(STORAGE_KEYS.attendance, []);
  seedIfMissingOrEmpty(STORAGE_KEYS.eventFormFields, []);
  seedIfMissingOrEmpty(STORAGE_KEYS.volunteerRoles, seedVolunteerRoles);
  seedIfMissingOrEmpty(STORAGE_KEYS.volunteerApplications, seedVolunteerApplications);
  seedIfMissingOrEmpty(STORAGE_KEYS.volunteerTasks, seedVolunteerTasks);
  seedIfMissingOrEmpty(STORAGE_KEYS.sponsorPackages, seedSponsorPackages);
  seedIfMissingOrEmpty(STORAGE_KEYS.sponsorInterests, seedSponsorInterests);
  seedIfMissingOrEmpty(STORAGE_KEYS.budgetItems, seedBudgetItems);
  seedIfMissingOrEmpty(STORAGE_KEYS.certificates, seedCertificates);
  seedIfMissingOrEmpty(STORAGE_KEYS.passportRecords, seedPassportRecords);
  migrateSeedEventDates();
  ensureCreatedShowcaseEvents();
}

initStore();

function genId() { return crypto.randomUUID?.() || Math.random().toString(36).substring(2); }

// Feature 6 — derive volunteer badges from contribution milestones.
function badgesFor(points: number, tasksCompleted: number, checkInsHandled: number, hours: number): string[] {
  const badges: string[] = [];
  if (points >= 300) badges.push('Champion');
  else if (points >= 150) badges.push('Pro');
  else if (points >= 50) badges.push('Rising Star');
  if (tasksCompleted >= 3) badges.push('Task Master');
  if (checkInsHandled >= 5) badges.push('Check-in Hero');
  if (hours >= 10) badges.push('Marathoner');
  return badges;
}

function generateRegistrationCode() {
  return `OCI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function defaultFormFields(eventId: string): EventFormField[] {
  const fields: Array<Pick<EventFormField, 'label' | 'field_type' | 'required'>> = [
    { label: 'Full Name', field_type: 'text', required: true },
    { label: 'Email', field_type: 'email', required: true },
    { label: 'Phone Number', field_type: 'phone', required: true },
    { label: 'College / Organization', field_type: 'text', required: true },
    { label: 'Why do you want to attend?', field_type: 'textarea', required: true },
  ];

  return fields.map((field, index) => ({
    id: `default-${eventId}-${index}`,
    event_id: eventId,
    options: [],
    sort_order: index,
    created_at: new Date().toISOString(),
    ...field,
  }));
}

function getDemoCurrentUser(): Profile | null {
  const session = readSession();
  if (!session?.name || !session?.username || !isUserRole(session.role)) return null;
  return profileFromSession(session);
}

export const store = {
  getCurrentUser(): Profile | null {
    return getDemoCurrentUser();
  },
  setCurrentUser(user: Profile | null) {
    if (!user) {
      clearSession();
      return;
    }
    if (!isUserRole(user.role)) return;
    writeSession(user.role, {
      id: user.id,
      name: user.full_name,
      username: user.username,
      email: user.email,
      instagram_url: user.instagram_url,
      linkedin_url: user.linkedin_url,
      github_url: user.github_url,
    });
  },

  // Auth
  signUp(email: string, _password: string, full_name: string, username: string, role: string): Profile {
    void email;
    void _password;
    void full_name;
    void username;
    void role;
    throw new Error('Email signup is disabled. Use the Continue as role screen.');
  },
  signIn(email: string, _password: string): Profile {
    void email;
    void _password;
    throw new Error('Password login is disabled. Use the Continue as role screen.');
  },
  signOut() {
    store.setCurrentUser(null);
  },

  // Profiles
  getProfiles(): Profile[] {
    const profiles = getItem<Profile[]>(STORAGE_KEYS.profiles, []);
    const missingDemoProfiles = DEMO_PROFILES.filter(demo => !profiles.some(profile => profile.id === demo.id));
    return [...profiles, ...missingDemoProfiles];
  },
  getProfileByUsername(username: string): Profile | undefined {
    return store.getProfiles().find(p => p.username === username || p.passport_slug === username);
  },
  getProfileById(id: string): Profile | undefined {
    return store.getProfiles().find(p => p.id === id);
  },
  updateProfile(id: string, patch: Partial<Profile>): Profile | null {
    const profiles = getItem<Profile[]>(STORAGE_KEYS.profiles, []);
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx < 0) {
      // Demo profiles live outside persisted list — materialize then update
      const demo = DEMO_PROFILES.find((p) => p.id === id);
      if (!demo) return null;
      const next = { ...demo, ...patch, id };
      profiles.push(next);
      setItem(STORAGE_KEYS.profiles, profiles);
      const current = store.getCurrentUser();
      if (current?.id === id) store.setCurrentUser(next);
      return next;
    }
    const next = { ...profiles[idx], ...patch, id };
    profiles[idx] = next;
    setItem(STORAGE_KEYS.profiles, profiles);
    const current = store.getCurrentUser();
    if (current?.id === id) store.setCurrentUser(next);
    return next;
  },

  // Events
  getEvents(): Event[] {
    return getItem<Event[]>(STORAGE_KEYS.events, []);
  },
  getPublishedEvents(): Event[] {
    return sortUpcomingEvents(store.getEvents().filter(isActivePublishedEvent));
  },
  getPastPublishedEvents(): Event[] {
    return sortPastEvents(store.getEvents().filter(e => e.status === 'published' && isPastEvent(e.date)));
  },
  getEventBySlug(slug: string): Event | undefined {
    return store.getEvents().find(e => e.slug === slug);
  },
  getEventById(id: string): Event | undefined {
    return store.getEvents().find(e => e.id === id);
  },
  getOrganizerEvents(organizerId: string): Event[] {
    return store.getEvents().filter(e => isRelatedProfileId(e.organizer_id, organizerId));
  },
  createEvent(event: Omit<Event, 'id' | 'created_at'>): Event {
    const events = store.getEvents();
    const newEvent: Event = { ...event, id: genId(), created_at: new Date().toISOString() };
    events.push(newEvent);
    setItem(STORAGE_KEYS.events, events);
    return newEvent;
  },
  upsertEvent(event: Event): Event {
    const events = store.getEvents();
    const idx = events.findIndex(existing => existing.id === event.id);
    if (idx === -1) {
      events.push(event);
    } else {
      events[idx] = { ...events[idx], ...event };
    }
    setItem(STORAGE_KEYS.events, events);
    return event;
  },
  updateEvent(id: string, updates: Partial<Event>): Event | undefined {
    const events = store.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    events[idx] = { ...events[idx], ...updates };
    setItem(STORAGE_KEYS.events, events);
    return events[idx];
  },

  // Registrations
  getRegistrations(): Registration[] {
    const registrations = getItem<Registration[]>(STORAGE_KEYS.registrations, []);
    return registrations.map((registration) => ({
      ...registration,
      status: (registration.status as string) === 'registered' ? 'approved' : registration.status,
      form_answers: registration.form_answers || {},
      reviewed_by: registration.reviewed_by || null,
      reviewed_at: registration.reviewed_at || null,
      rejection_reason: registration.rejection_reason || null,
    }));
  },
  getEventRegistrations(eventId: string): Registration[] {
    const regs = store.getRegistrations().filter(r => r.event_id === eventId);
    const profiles = store.getProfiles();
    return regs.map(r => ({ ...r, participant: profiles.find(p => p.id === r.participant_id) }));
  },
  getParticipantRegistrations(participantId: string): Registration[] {
    return store.getRegistrations().filter(r => isRelatedProfileId(r.participant_id, participantId));
  },
  getRegistrationByCode(code: string): Registration | undefined {
    return store.getRegistrations().find(r => r.registration_code === code);
  },
  createRegistration(reg: Omit<Registration, 'id' | 'registered_at'>): Registration {
    const regs = store.getRegistrations();
    const participantIds = relatedProfileIds(reg.participant_id);
    const exists = regs.find(r => r.event_id === reg.event_id && participantIds.includes(r.participant_id));
    if (exists) throw new Error('Already registered for this event');
    const newReg: Registration = {
      ...reg,
      registration_code: reg.status === 'approved' || reg.status === 'attended' ? reg.registration_code || generateRegistrationCode() : null,
      form_answers: reg.form_answers || {},
      reviewed_by: reg.reviewed_by || null,
      reviewed_at: reg.reviewed_at || null,
      rejection_reason: reg.rejection_reason || null,
      id: genId(),
      registered_at: new Date().toISOString()
    };
    regs.push(newReg);
    setItem(STORAGE_KEYS.registrations, regs);
    return newReg;
  },
  updateRegistration(id: string, updates: Partial<Registration>) {
    const regs = store.getRegistrations();
    const idx = regs.findIndex(r => r.id === id);
    if (idx !== -1) { regs[idx] = { ...regs[idx], ...updates }; setItem(STORAGE_KEYS.registrations, regs); }
  },
  approveRegistration(id: string, reviewedBy: string): Registration | undefined {
    const regs = store.getRegistrations();
    const idx = regs.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    let code = regs[idx].registration_code || generateRegistrationCode();
    while (regs.some(r => r.id !== id && r.registration_code === code)) code = generateRegistrationCode();
    regs[idx] = {
      ...regs[idx],
      status: 'approved',
      registration_code: code,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    };
    setItem(STORAGE_KEYS.registrations, regs);
    return regs[idx];
  },
  rejectRegistration(id: string, reviewedBy: string, reason: string): Registration | undefined {
    const regs = store.getRegistrations();
    const idx = regs.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    regs[idx] = {
      ...regs[idx],
      status: 'rejected',
      registration_code: null,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    };
    setItem(STORAGE_KEYS.registrations, regs);
    return regs[idx];
  },

  // Attendance
  getAttendance(): Attendance[] {
    return getItem<Attendance[]>(STORAGE_KEYS.attendance, []);
  },
  createAttendance(attendance: Omit<Attendance, 'id' | 'checked_in_at'>): Attendance {
    const rows = store.getAttendance();
    const existingIdx = rows.findIndex(row => row.registration_id === attendance.registration_id);
    if (existingIdx !== -1) {
      rows[existingIdx] = {
        ...rows[existingIdx],
        ...attendance,
        id: rows[existingIdx].id,
        checked_in_at: rows[existingIdx].checked_in_at || new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.attendance, rows);
      return rows[existingIdx];
    }
    const row: Attendance = { ...attendance, id: genId(), checked_in_at: new Date().toISOString() };
    rows.push(row);
    setItem(STORAGE_KEYS.attendance, rows);
    return row;
  },

  // Registration Form Fields
  getEventFormFields(eventId: string): EventFormField[] {
    const fields = getItem<EventFormField[]>(STORAGE_KEYS.eventFormFields, []).filter(field => field.event_id === eventId);
    return fields.length > 0 ? fields.sort((a, b) => a.sort_order - b.sort_order) : defaultFormFields(eventId);
  },
  getCustomEventFormFields(eventId: string): EventFormField[] {
    return getItem<EventFormField[]>(STORAGE_KEYS.eventFormFields, [])
      .filter(field => field.event_id === eventId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  saveEventFormFields(eventId: string, fields: Array<Omit<EventFormField, 'id' | 'event_id' | 'created_at'>>) {
    const allFields = getItem<EventFormField[]>(STORAGE_KEYS.eventFormFields, []).filter(field => field.event_id !== eventId);
    const nextFields: EventFormField[] = fields.map((field, index) => ({
      ...field,
      id: genId(),
      event_id: eventId,
      sort_order: index,
      options: field.options || [],
      created_at: new Date().toISOString(),
    }));
    setItem(STORAGE_KEYS.eventFormFields, [...allFields, ...nextFields]);
    return nextFields;
  },

  // Volunteer Roles
  getVolunteerRoles(): VolunteerRole[] {
    return getItem<VolunteerRole[]>(STORAGE_KEYS.volunteerRoles, []);
  },
  getEventVolunteerRoles(eventId: string): VolunteerRole[] {
    return store.getVolunteerRoles().filter(vr => vr.event_id === eventId);
  },
  createVolunteerRole(role: Omit<VolunteerRole, 'id'>): VolunteerRole {
    const roles = store.getVolunteerRoles();
    const newRole: VolunteerRole = { ...role, id: genId() };
    roles.push(newRole);
    setItem(STORAGE_KEYS.volunteerRoles, roles);
    return newRole;
  },

  // Volunteer Applications
  getVolunteerApplications(): VolunteerApplication[] {
    return getItem<VolunteerApplication[]>(STORAGE_KEYS.volunteerApplications, []).map(app => ({
      ...app,
      role_requested: app.role_requested || app.role?.role_name || 'General Volunteer',
      skills: app.skills || [],
      availability: app.availability || '',
      preferred_task_place: app.preferred_task_place || '',
      reason: app.reason || '',
    }));
  },
  getEventVolunteerApplications(eventId: string): VolunteerApplication[] {
    const apps = store.getVolunteerApplications().filter(a => a.event_id === eventId);
    const profiles = store.getProfiles();
    const roles = store.getVolunteerRoles();
    return apps.map(a => ({
      ...a,
      volunteer: profiles.find(p => p.id === a.volunteer_id),
      role: roles.find(r => r.id === a.role_id)
    }));
  },
  getVolunteerApplicationsByUser(volunteerId: string): VolunteerApplication[] {
    const apps = store.getVolunteerApplications().filter(a => isRelatedProfileId(a.volunteer_id, volunteerId));
    const events = store.getEvents();
    const roles = store.getVolunteerRoles();
    return apps.map(a => ({ ...a, event: events.find(e => e.id === a.event_id), role: a.role || roles.find(r => r.id === a.role_id) }));
  },
  createVolunteerApplication(app: Omit<VolunteerApplication, 'id' | 'applied_at'>): VolunteerApplication {
    const apps = store.getVolunteerApplications();
    const requestedRole = (app.role_requested || app.role?.role_name || 'General Volunteer').trim().toLowerCase();
    const duplicate = apps.find(existing =>
      existing.event_id === app.event_id
      && isRelatedProfileId(existing.volunteer_id, app.volunteer_id)
      && (existing.role_requested || existing.role?.role_name || 'General Volunteer').trim().toLowerCase() === requestedRole
    );
    if (duplicate) throw new Error('You already applied for this volunteer role.');
    const newApp: VolunteerApplication = { ...app, id: genId(), applied_at: new Date().toISOString() };
    apps.push(newApp);
    setItem(STORAGE_KEYS.volunteerApplications, apps);
    return newApp;
  },
  updateVolunteerApplication(id: string, updates: Partial<VolunteerApplication>) {
    const apps = store.getVolunteerApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) { apps[idx] = { ...apps[idx], ...updates }; setItem(STORAGE_KEYS.volunteerApplications, apps); }
  },

  // Volunteer Tasks
  getVolunteerTasks(): VolunteerTask[] {
    return getItem<VolunteerTask[]>(STORAGE_KEYS.volunteerTasks, []).map(task => ({
      ...task,
      volunteer_id: task.volunteer_id || task.assigned_to,
      assigned_to: task.assigned_to || task.volunteer_id,
      status: task.status === 'todo' ? 'assigned' : task.status,
      task_role: task.task_role || 'Volunteer',
      skills_earned: task.skills_earned || task.skills_gained || [],
      skills_gained: task.skills_gained || task.skills_earned || [],
      start_time: task.start_time || '',
      end_time: task.end_time || '',
    }));
  },
  getEventVolunteerTasks(eventId: string): VolunteerTask[] {
    const tasks = store.getVolunteerTasks().filter(t => t.event_id === eventId);
    const profiles = store.getProfiles();
    return tasks.map(t => ({ ...t, assignee: profiles.find(p => p.id === t.assigned_to) }));
  },
  getVolunteerTasksByUser(volunteerId: string): VolunteerTask[] {
    const tasks = store.getVolunteerTasks().filter(t => isRelatedProfileId(t.assigned_to || t.volunteer_id, volunteerId));
    const events = store.getEvents();
    return tasks.map(t => ({ ...t, event: events.find(e => e.id === t.event_id) }));
  },
  createVolunteerTask(task: Omit<VolunteerTask, 'id' | 'created_at'>): VolunteerTask {
    const tasks = store.getVolunteerTasks();
    const newTask: VolunteerTask = {
      ...task,
      volunteer_id: task.volunteer_id || task.assigned_to,
      assigned_to: task.assigned_to || task.volunteer_id,
      status: task.status === 'todo' ? 'assigned' : task.status,
      skills_earned: task.skills_earned || task.skills_gained || [],
      skills_gained: task.skills_gained || task.skills_earned || [],
      id: genId(),
      created_at: new Date().toISOString()
    };
    tasks.push(newTask);
    setItem(STORAGE_KEYS.volunteerTasks, tasks);
    return newTask;
  },
  updateVolunteerTask(id: string, updates: Partial<VolunteerTask>) {
    const tasks = store.getVolunteerTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      const nextUpdates: Partial<VolunteerTask> = {
        ...updates,
        skills_earned: updates.skills_earned || updates.skills_gained || tasks[idx].skills_earned,
        skills_gained: updates.skills_gained || updates.skills_earned || tasks[idx].skills_gained,
      };
      if (updates.status) nextUpdates.status = updates.status === 'todo' ? 'assigned' : updates.status;
      tasks[idx] = { ...tasks[idx], ...nextUpdates };
      setItem(STORAGE_KEYS.volunteerTasks, tasks);
    }
  },

  // Sponsor Packages
  getSponsorPackages(): SponsorPackage[] {
    return getItem<SponsorPackage[]>(STORAGE_KEYS.sponsorPackages, []);
  },
  getEventSponsorPackages(eventId: string): SponsorPackage[] {
    return store.getSponsorPackages().filter(sp => sp.event_id === eventId);
  },
  createSponsorPackage(pkg: Omit<SponsorPackage, 'id'>): SponsorPackage {
    const pkgs = store.getSponsorPackages();
    const newPkg: SponsorPackage = { ...pkg, id: genId() };
    pkgs.push(newPkg);
    setItem(STORAGE_KEYS.sponsorPackages, pkgs);
    return newPkg;
  },

  // Sponsor Interests
  getSponsorInterests(): SponsorInterest[] {
    return getItem<SponsorInterest[]>(STORAGE_KEYS.sponsorInterests, []);
  },
  getEventSponsorInterests(eventId: string): SponsorInterest[] {
    const interests = store.getSponsorInterests().filter(si => si.event_id === eventId);
    const profiles = store.getProfiles();
    const packages = store.getSponsorPackages();
    return interests.map(si => ({
      ...si,
      sponsor: profiles.find(p => p.id === si.sponsor_id),
      package: packages.find(pk => pk.id === si.package_id)
    }));
  },
  getSponsorInterestsBySponsor(sponsorId: string): SponsorInterest[] {
    const interests = store.getSponsorInterests().filter(si => isRelatedProfileId(si.sponsor_id, sponsorId));
    const events = store.getEvents();
    return interests.map(si => ({ ...si, event: events.find(e => e.id === si.event_id) }));
  },
  createSponsorInterest(interest: Omit<SponsorInterest, 'id' | 'created_at'>): SponsorInterest {
    const interests = store.getSponsorInterests();
    const newInterest: SponsorInterest = { ...interest, id: genId(), created_at: new Date().toISOString() };
    interests.push(newInterest);
    setItem(STORAGE_KEYS.sponsorInterests, interests);
    return newInterest;
  },
  updateSponsorInterest(id: string, updates: Partial<SponsorInterest>) {
    const interests = store.getSponsorInterests();
    const idx = interests.findIndex(si => si.id === id);
    if (idx !== -1) { interests[idx] = { ...interests[idx], ...updates }; setItem(STORAGE_KEYS.sponsorInterests, interests); }
  },

  // Budget Items
  getBudgetItems(): BudgetItem[] {
    return getItem<BudgetItem[]>(STORAGE_KEYS.budgetItems, []);
  },
  getEventBudgetItems(eventId: string): BudgetItem[] {
    return store.getBudgetItems().filter(b => b.event_id === eventId);
  },
  createBudgetItem(item: Omit<BudgetItem, 'id' | 'created_at'>): BudgetItem {
    const items = store.getBudgetItems();
    const newItem: BudgetItem = { ...item, id: genId(), created_at: new Date().toISOString() };
    items.push(newItem);
    setItem(STORAGE_KEYS.budgetItems, items);
    return newItem;
  },
  deleteBudgetItem(id: string) {
    const items = store.getBudgetItems().filter(i => i.id !== id);
    setItem(STORAGE_KEYS.budgetItems, items);
  },

  // Certificates
  getCertificates(): Certificate[] {
    return getItem<Certificate[]>(STORAGE_KEYS.certificates, []);
  },
  getEventCertificates(eventId: string): Certificate[] {
    const certs = store.getCertificates().filter(c => c.event_id === eventId);
    const profiles = store.getProfiles();
    return certs.map(c => ({ ...c, user: profiles.find(p => p.id === c.user_id) }));
  },
  getUserCertificates(userId: string): Certificate[] {
    const certs = store.getCertificates().filter(c => isRelatedProfileId(c.user_id, userId));
    const events = store.getEvents();
    return certs.map(c => ({ ...c, event: events.find(e => e.id === c.event_id) }));
  },
  getCertificateByCode(code: string): Certificate | undefined {
    return store.getCertificates().find(c => c.certificate_code === code);
  },
  createCertificate(cert: Omit<Certificate, 'id' | 'issued_at'>): Certificate {
    const certs = store.getCertificates();
    const newCert: Certificate = { ...cert, id: genId(), issued_at: new Date().toISOString() };
    certs.push(newCert);
    setItem(STORAGE_KEYS.certificates, certs);
    return newCert;
  },
  // Feature 2 — issue a certificate and mirror it to Supabase (etrack_certificates).
  // Binds Cardano attendance tx_hash when the participant checked in on-chain.
  issueCertificate(input: { event: Event; userId: string; userName: string; role?: string; organizerName?: string }): Certificate {
    const code = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Prefer on-chain attendance for this user + event
    const attendance = store.getAttendance().find(
      (a) => a.event_id === input.event.id && a.participant_id === input.userId && a.status === 'present',
    );
    const reg = store.getEventRegistrations(input.event.id).find((r) => r.participant_id === input.userId);
    const attFromReg = reg ? store.getAttendanceByRegistration(reg.id) : undefined;
    const proof = attendance?.tx_hash ? attendance : attFromReg;

    const cert = store.createCertificate({
      event_id: input.event.id,
      user_id: input.userId,
      certificate_code: code,
      role: input.role || 'Participant',
      tx_hash: proof?.tx_hash,
      wallet_address: proof?.wallet_address,
      explorer_url: proof?.explorer_url,
      check_in_method: proof?.check_in_method,
    });
    void pushRemote('etrack_certificates', {
      id: cert.id,
      event_id: input.event.id,
      event_title: input.event.title,
      user_id: input.userId,
      user_name: input.userName,
      certificate_code: code,
      role: cert.role,
      organizer_name: input.organizerName || '',
      event_date: input.event.date,
      issued_at: cert.issued_at,
      tx_hash: cert.tx_hash || '',
      wallet_address: cert.wallet_address || '',
      explorer_url: cert.explorer_url || '',
    });
    return cert;
  },

  // Feature 1 — QR / manual check-in. Marks attendance, writes a passport
  // record, mirrors to Supabase (etrack_check_ins), and (optionally) credits
  // the volunteer who handled the desk with leaderboard points.
  checkInRegistration(reg: Registration, options?: {
    method?: 'manual' | 'qr' | 'cardano';
    handledById?: string;
    handledByName?: string;
    txHash?: string;
    walletAddress?: string;
    explorerUrl?: string;
  }): Attendance {
    const event = store.getEventById(reg.event_id);
    store.updateRegistration(reg.id, { status: 'attended' });
    const attendance = store.createAttendance({
      event_id: reg.event_id,
      registration_id: reg.id,
      participant_id: reg.participant_id,
      checked_in_by: options?.handledById || store.getCurrentUser()?.id,
      status: 'present',
      check_in_method: options?.method || 'manual',
      tx_hash: options?.txHash,
      wallet_address: options?.walletAddress,
      explorer_url: options?.explorerUrl,
    });
    // Persist on-chain fields even if createAttendance merges existing rows without them
    if (options?.txHash) {
      const rows = store.getAttendance();
      const idx = rows.findIndex(r => r.id === attendance.id || r.registration_id === reg.id);
      if (idx !== -1) {
        rows[idx] = {
          ...rows[idx],
          tx_hash: options.txHash,
          wallet_address: options.walletAddress,
          explorer_url: options.explorerUrl,
          check_in_method: options.method || 'cardano',
        };
        setItem(STORAGE_KEYS.attendance, rows);
      }
    }
    store.createPassportRecord({
      user_id: reg.participant_id,
      event_id: reg.event_id,
      record_type: 'attendance',
      title: event?.title || 'Event',
      description: options?.txHash
        ? `Attended as Participant · Cardano proof ${options.txHash.slice(0, 12)}…`
        : 'Attended as Participant',
      skills: event ? [event.category] : [],
      hours: 0,
      verified_at: new Date().toISOString(),
      verified_by: options?.txHash ? `cardano:${options.txHash}` : undefined,
    });
    const participant = store.getProfileById(reg.participant_id);
    void pushRemote('etrack_check_ins', {
      id: attendance.id,
      event_id: reg.event_id,
      registration_id: reg.id,
      participant_id: reg.participant_id,
      participant_name: participant?.full_name || reg.participant?.full_name || '',
      registration_code: reg.registration_code || '',
      checked_in_by: options?.handledById || store.getCurrentUser()?.id || '',
      handled_by_name: options?.handledByName || '',
      method: options?.method || 'manual',
      tx_hash: options?.txHash || '',
      wallet_address: options?.walletAddress || '',
      status: 'present',
      checked_in_at: attendance.checked_in_at,
    }, 'registration_id');
    if (options?.handledById) {
      store.addVolunteerPoints(options.handledById, POINTS.checkInHandled, 'Check-in handled', reg.event_id, options.handledByName);
    }
    return attendance;
  },

  getAttendanceByRegistration(registrationId: string): Attendance | undefined {
    return store.getAttendance().find(a => a.registration_id === registrationId);
  },

  getOnChainAttendance(eventId?: string): Attendance[] {
    return store.getAttendance().filter(a => a.tx_hash && (!eventId || a.event_id === eventId));
  },

  // Feature 5 — Volunteer skills + availability profiles.
  getVolunteerProfiles(): VolunteerProfile[] {
    return getItem<VolunteerProfile[]>(STORAGE_KEYS.volunteerProfiles, []);
  },
  getVolunteerProfile(userId: string): VolunteerProfile | undefined {
    return store.getVolunteerProfiles().find(p => p.user_id === userId);
  },
  saveVolunteerProfile(profile: Omit<VolunteerProfile, 'updated_at'>): VolunteerProfile {
    const profiles = store.getVolunteerProfiles();
    const next: VolunteerProfile = { ...profile, updated_at: new Date().toISOString() };
    const idx = profiles.findIndex(p => p.user_id === profile.user_id);
    if (idx === -1) profiles.push(next); else profiles[idx] = next;
    setItem(STORAGE_KEYS.volunteerProfiles, profiles);
    void pushRemote('etrack_volunteer_profiles', {
      user_id: next.user_id,
      full_name: next.full_name || '',
      skills: next.skills,
      availability: next.availability,
      recommended_roles: next.recommended_roles || [],
      updated_at: next.updated_at,
    }, 'user_id');
    return next;
  },

  // Feature 6 — Volunteer points ledger.
  getVolunteerPoints(): VolunteerPointsEntry[] {
    return getItem<VolunteerPointsEntry[]>(STORAGE_KEYS.volunteerPoints, []);
  },
  addVolunteerPoints(userId: string, points: number, reason: string, eventId?: string, fullName?: string): VolunteerPointsEntry {
    const entries = store.getVolunteerPoints();
    const name = fullName || store.getProfileById(userId)?.full_name;
    const entry: VolunteerPointsEntry = {
      id: genId(), user_id: userId, full_name: name, points, reason, event_id: eventId,
      created_at: new Date().toISOString(),
    };
    entries.push(entry);
    setItem(STORAGE_KEYS.volunteerPoints, entries);
    void pushRemote('etrack_volunteer_points', { ...entry, full_name: name || '' });
    return entry;
  },

  // Pull the new-feature tables back from Supabase into the local cache so
  // data persists across devices/sessions when migration 005 is applied.
  async hydrateEtrack(): Promise<void> {
    const [profiles, points] = await Promise.all([
      pullRemote<VolunteerProfile>('etrack_volunteer_profiles'),
      pullRemote<VolunteerPointsEntry>('etrack_volunteer_points'),
    ]);
    if (profiles && profiles.length) {
      const local = store.getVolunteerProfiles();
      const merged = new Map<string, VolunteerProfile>();
      [...local, ...profiles].forEach(p => merged.set(p.user_id, {
        user_id: p.user_id,
        full_name: p.full_name,
        skills: Array.isArray(p.skills) ? p.skills : [],
        availability: p.availability || '',
        recommended_roles: p.recommended_roles || [],
        updated_at: p.updated_at || new Date().toISOString(),
      }));
      setItem(STORAGE_KEYS.volunteerProfiles, Array.from(merged.values()));
    }
    if (points && points.length) {
      const local = store.getVolunteerPoints();
      const byId = new Map<string, VolunteerPointsEntry>();
      [...local, ...points].forEach(p => byId.set(p.id, p));
      setItem(STORAGE_KEYS.volunteerPoints, Array.from(byId.values()));
    }
  },

  // Feature 6 — Computed leaderboard from completed tasks, hours, check-ins
  // handled, plus any manual bonus points in the ledger.
  getVolunteerLeaderboard(): LeaderboardEntry[] {
    const tasks = store.getVolunteerTasks();
    const attendance = store.getAttendance();
    const bonus = store.getVolunteerPoints();
    const profiles = store.getProfiles();

    const ids = new Set<string>();
    tasks.forEach(t => { const id = t.assigned_to || t.volunteer_id; if (id) ids.add(id); });
    attendance.forEach(a => { if (a.checked_in_by) ids.add(a.checked_in_by); });
    bonus.forEach(b => ids.add(b.user_id));
    profiles.filter(p => p.role === 'volunteer').forEach(p => ids.add(p.id));

    const rows = Array.from(ids).map((userId) => {
      const userTasks = tasks.filter(t => (t.assigned_to || t.volunteer_id) === userId);
      const completed = userTasks.filter(t => t.status === 'completed');
      const hours = completed.reduce((s, t) => s + (t.hours || 0), 0);
      const checkInsHandled = attendance.filter(a => a.checked_in_by === userId).length;
      const ledger = bonus.filter(b => b.user_id === userId);
      const ledgerPoints = ledger.reduce((s, b) => s + b.points, 0);
      const taskLedger = ledger.filter(b => b.reason.startsWith('Task completed')).reduce((s, b) => s + b.points, 0);
      const hourLedger = ledger.filter(b => b.reason.startsWith('Volunteer hours')).reduce((s, b) => s + b.points, 0);
      const checkInLedger = ledger.filter(b => b.reason === 'Check-in handled').reduce((s, b) => s + b.points, 0);
      const otherLedger = ledgerPoints - taskLedger - hourLedger - checkInLedger;
      const points =
        Math.max(completed.length * POINTS.taskCompleted, taskLedger) +
        Math.max(hours * POINTS.perHour, hourLedger) +
        Math.max(checkInsHandled * POINTS.checkInHandled, checkInLedger) +
        otherLedger;
      const profile = profiles.find(p => p.id === userId);
      const name = profile?.full_name || ledger[0]?.full_name || userTasks[0]?.assignee?.full_name || 'Volunteer';
      return {
        user_id: userId,
        full_name: name,
        points,
        tasksCompleted: completed.length,
        hours,
        checkInsHandled,
        badges: badgesFor(points, completed.length, checkInsHandled, hours),
        rank: 0,
      } as LeaderboardEntry;
    });

    return rows
      .filter(r => r.points > 0 || r.tasksCompleted > 0 || r.checkInsHandled > 0)
      .sort((a, b) => b.points - a.points)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  },

  // Passport Records
  getPassportRecords(): PassportRecord[] {
    return getItem<PassportRecord[]>(STORAGE_KEYS.passportRecords, []);
  },
  getUserPassportRecords(userId: string): PassportRecord[] {
    const records = store.getPassportRecords().filter(pr => isRelatedProfileId(pr.user_id, userId));
    const events = store.getEvents();
    return records.map(r => ({ ...r, event: events.find(e => e.id === r.event_id) }));
  },
  getPassportRecordsByUsername(username: string): PassportRecord[] {
    const profile = store.getProfileByUsername(username);
    if (!profile) return [];
    return store.getUserPassportRecords(profile.id);
  },
  createPassportRecord(record: Omit<PassportRecord, 'id' | 'created_at'>): PassportRecord {
    const records = store.getPassportRecords();
    const duplicate = records.find(existing =>
      existing.user_id === record.user_id
      && existing.event_id === record.event_id
      && existing.record_type === record.record_type
      && existing.title === record.title
    );
    if (duplicate) return duplicate;
    const newRecord: PassportRecord = { ...record, id: genId(), created_at: new Date().toISOString() };
    records.push(newRecord);
    setItem(STORAGE_KEYS.passportRecords, records);
    return newRecord;
  },

  getWinnerSelfies(): WinnerSelfie[] {
    return getItem<WinnerSelfie[]>(STORAGE_KEYS.winnerSelfies, []);
  },
  getWinnerSelfiesForUser(userId: string): WinnerSelfie[] {
    return store.getWinnerSelfies().filter((s) => s.user_id === userId);
  },
  getWinnerSelfieForEvent(eventId: string, userId: string): WinnerSelfie | undefined {
    return store.getWinnerSelfies().find((s) => s.event_id === eventId && s.user_id === userId);
  },
  getEventWinners(eventId?: string): EventWinner[] {
    const rows = getItem<EventWinner[]>(STORAGE_KEYS.eventWinners, []);
    const list = eventId ? rows.filter((w) => w.event_id === eventId) : rows;
    return list
      .map((w) => ({ ...w, user: store.getProfileById(w.user_id) }))
      .sort((a, b) => a.place - b.place);
  },
  getPrizePool(eventId: string): EventPrizePool | null {
    const pools = getItem<EventPrizePool[]>(STORAGE_KEYS.prizePools, []);
    return pools.find((p) => p.event_id === eventId) || null;
  },
  setPrizePool(eventId: string, totalAmount: number, currency: 'INR' | 'ADA' = 'INR', notes?: string): EventPrizePool {
    const pools = getItem<EventPrizePool[]>(STORAGE_KEYS.prizePools, []);
    const next: EventPrizePool = {
      event_id: eventId,
      total_amount: Math.max(0, totalAmount),
      currency,
      notes,
      updated_at: new Date().toISOString(),
    };
    const idx = pools.findIndex((p) => p.event_id === eventId);
    if (idx >= 0) pools[idx] = next;
    else pools.push(next);
    setItem(STORAGE_KEYS.prizePools, pools);
    return next;
  },
  selectEventWinner(input: {
    eventId: string;
    userId: string;
    place: number;
    prizeLabel: string;
    prizeAmount: number;
    prizeCurrency?: 'INR' | 'ADA';
    walletAddress?: string;
  }): EventWinner {
    const rows = getItem<EventWinner[]>(STORAGE_KEYS.eventWinners, []);
    // One winner per place per event
    const withoutSamePlace = rows.filter(
      (w) => !(w.event_id === input.eventId && w.place === input.place && w.status === 'selected'),
    );
    // Don't overwrite paid winners for same place
    const paidSamePlace = rows.find(
      (w) => w.event_id === input.eventId && w.place === input.place && w.status === 'paid',
    );
    if (paidSamePlace) {
      throw new Error(`Place #${input.place} is already paid out. Pick another place.`);
    }
    // Replace unselected/selected for same user on this event
    const filtered = withoutSamePlace.filter(
      (w) => !(w.event_id === input.eventId && w.user_id === input.userId && w.status === 'selected'),
    );
    const profile = store.getProfileById(input.userId);
    const row: EventWinner = {
      id: genId(),
      event_id: input.eventId,
      user_id: input.userId,
      place: input.place,
      prize_label: input.prizeLabel || `${input.place === 1 ? '1st' : input.place === 2 ? '2nd' : input.place === 3 ? '3rd' : `${input.place}th`} Prize`,
      prize_amount: Math.max(0, input.prizeAmount),
      prize_currency: input.prizeCurrency || 'INR',
      wallet_address: input.walletAddress || profile?.cardano_address,
      status: 'selected',
      created_at: new Date().toISOString(),
    };
    filtered.push(row);
    setItem(STORAGE_KEYS.eventWinners, filtered);

    const event = store.getEventById(input.eventId);
    store.createPassportRecord({
      user_id: input.userId,
      event_id: input.eventId,
      record_type: 'certificate',
      title: `${event?.title || 'Event'} · ${row.prize_label}`,
      description: `Selected as place #${row.place} with prize ${row.prize_currency} ${row.prize_amount}`,
      skills: ['Winner', row.prize_label],
      hours: 0,
      verified_at: new Date().toISOString(),
    });
    return { ...row, user: profile };
  },
  /**
   * Mark prize as paid + record budget expense so organizers can track payouts.
   */
  payEventWinner(winnerId: string, paymentNote?: string): EventWinner {
    const rows = getItem<EventWinner[]>(STORAGE_KEYS.eventWinners, []);
    const idx = rows.findIndex((w) => w.id === winnerId);
    if (idx < 0) throw new Error('Winner record not found');
    if (rows[idx].status === 'paid') return { ...rows[idx], user: store.getProfileById(rows[idx].user_id) };

    const winner = rows[idx];
    const profile = store.getProfileById(winner.user_id);
    const event = store.getEventById(winner.event_id);
    const updated: EventWinner = {
      ...winner,
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_note: paymentNote || winner.payment_note,
    };
    rows[idx] = updated;
    setItem(STORAGE_KEYS.eventWinners, rows);

    if (winner.prize_amount > 0) {
      store.createBudgetItem({
        event_id: winner.event_id,
        type: 'expense',
        title: `Prize payout: ${winner.prize_label} — ${profile?.full_name || 'Winner'}`,
        amount: winner.prize_amount,
        category: 'Prize money',
        notes: paymentNote || `Place #${winner.place} · ${winner.prize_currency}`,
      });
    }

    store.createPassportRecord({
      user_id: winner.user_id,
      event_id: winner.event_id,
      record_type: 'certificate',
      title: `${event?.title || 'Event'} · Prize paid (${winner.prize_label})`,
      description: paymentNote || `Prize ${winner.prize_currency} ${winner.prize_amount} marked paid by organizer`,
      skills: ['Prize', winner.prize_label],
      hours: 0,
      verified_at: new Date().toISOString(),
    });

    return { ...updated, user: profile };
  },
  removeEventWinner(winnerId: string) {
    const rows = getItem<EventWinner[]>(STORAGE_KEYS.eventWinners, []);
    const target = rows.find((w) => w.id === winnerId);
    if (!target) return;
    if (target.status === 'paid') throw new Error('Cannot remove a paid winner. Adjust budget manually if needed.');
    setItem(
      STORAGE_KEYS.eventWinners,
      rows.filter((w) => w.id !== winnerId),
    );
  },

  saveWinnerSelfie(input: {
    eventId: string;
    userId: string;
    selfieDataUrl: string;
    walletAddress?: string;
    note?: string;
  }): WinnerSelfie {
    const rows = store.getWinnerSelfies();
    const existingIdx = rows.findIndex(
      (s) => s.event_id === input.eventId && s.user_id === input.userId,
    );
    const row: WinnerSelfie = {
      id: existingIdx >= 0 ? rows[existingIdx].id : genId(),
      event_id: input.eventId,
      user_id: input.userId,
      selfie_data_url: input.selfieDataUrl,
      wallet_address: input.walletAddress,
      note: input.note,
      created_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) rows[existingIdx] = row;
    else rows.push(row);
    setItem(STORAGE_KEYS.winnerSelfies, rows);

    const event = store.getEventById(input.eventId);
    store.createPassportRecord({
      user_id: input.userId,
      event_id: input.eventId,
      record_type: 'certificate',
      title: `${event?.title || 'Event'} · Winner spotlight selfie`,
      description: input.note || 'Winner selfie claim for event spotlight / prize offers',
      skills: ['Winner', 'Spotlight'],
      hours: 0,
      verified_at: new Date().toISOString(),
    });
    return row;
  },

  // Stats
  getOrganizerStats(organizerId: string) {
    const events = store.getOrganizerEvents(organizerId);
    const eventIds = events.map(e => e.id);
    const allRegs = store.getRegistrations().filter(r => eventIds.includes(r.event_id));
    const attended = allRegs.filter(r => r.status === 'attended');
    const allTasks = store.getVolunteerTasks().filter(t => eventIds.includes(t.event_id));
    const allInterests = store.getSponsorInterests().filter(si => eventIds.includes(si.event_id));
    const allCerts = store.getCertificates().filter(c => eventIds.includes(c.event_id));
    const allBudgets = store.getBudgetItems().filter(b => eventIds.includes(b.event_id));
    const income = allBudgets.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0);
    const expense = allBudgets.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0);
    return {
      totalEvents: events.length,
      totalRegistrations: allRegs.length,
      totalAttendance: attended.length,
      totalVolunteers: allTasks.length,
      totalSponsorLeads: allInterests.length,
      totalCertificates: allCerts.length,
      budgetBalance: income - expense,
    };
  },
  getParticipantStats(participantId: string) {
    const regs = store.getRegistrations().filter(r => isRelatedProfileId(r.participant_id, participantId));
    const certs = store.getCertificates().filter(c => isRelatedProfileId(c.user_id, participantId));
    const records = store.getPassportRecords().filter(pr => isRelatedProfileId(pr.user_id, participantId));
    return {
      registeredEvents: regs.length,
      upcomingEvents: regs.filter(r => r.status === 'pending' || r.status === 'approved').length,
      certificates: certs.length,
      proofRecords: records.length,
    };
  },
  getVolunteerStats(volunteerId: string) {
    const apps = store.getVolunteerApplications().filter(a => isRelatedProfileId(a.volunteer_id, volunteerId));
    const tasks = store.getVolunteerTasks().filter(t => isRelatedProfileId(t.assigned_to || t.volunteer_id, volunteerId));
    const completed = tasks.filter(t => t.status === 'completed');
    const totalHours = completed.reduce((s, t) => s + (t.hours || 0), 0);
    const allSkills = new Set<string>();
    completed.forEach(t => (t.skills_earned || t.skills_gained || []).forEach(s => allSkills.add(s)));
    const proofRecords = store.getPassportRecords().filter(pr => isRelatedProfileId(pr.user_id, volunteerId) && (pr.record_type === 'volunteer_task' || pr.record_type === 'volunteer'));
    return {
      applications: apps.length,
      approvedApplications: apps.filter(a => a.status === 'approved').length,
      assignedTasks: tasks.filter(t => t.status !== 'completed').length,
      completedHours: totalHours,
      skillsEarned: allSkills.size,
      proofRecords: proofRecords.length,
    };
  },
  getSponsorStats(sponsorId: string) {
    const interests = store.getSponsorInterests().filter(si => isRelatedProfileId(si.sponsor_id, sponsorId));
    const events = store.getPublishedEvents();
    return {
      matchingEvents: events.length,
      submittedInterests: interests.length,
      confirmedPartnerships: interests.filter(i => i.status === 'confirmed').length,
    };
  },
};

export default store;
