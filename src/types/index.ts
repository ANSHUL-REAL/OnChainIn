export type UserRole = 'organizer' | 'participant' | 'volunteer' | 'sponsor';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  passport_slug?: string;
  created_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  city?: string;
  poster_url?: string | null;
  max_participants: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  participant_id: string;
  participant?: Profile;
  registration_code?: string | null;
  qr_code_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'attended' | 'cancelled';
  form_answers?: Record<string, string | string[] | boolean>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  registered_at: string;
}

export interface EventFormField {
  id: string;
  event_id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'checkbox';
  required: boolean;
  options: string[];
  sort_order: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  registration_id: string;
  participant_id: string;
  checked_in_by?: string;
  checked_in_at: string;
  status: 'present' | 'absent';
  /** Cardano transaction hash for on-chain proof (OnChainIn) */
  tx_hash?: string;
  wallet_address?: string;
  check_in_method?: 'manual' | 'qr' | 'cardano';
  explorer_url?: string;
}

export interface OnChainProofRecord {
  id: string;
  kind: 'attendance' | 'registration' | 'volunteer' | 'certificate';
  event_id: string;
  registration_id?: string;
  user_id?: string;
  tx_hash: string;
  wallet_address: string;
  explorer_url: string;
  created_at: string;
}

export interface VolunteerRole {
  id: string;
  event_id: string;
  role_name: string;
  description?: string;
  required_count: number;
  skills?: string[];
}

export interface VolunteerApplication {
  id: string;
  event_id: string;
  volunteer_id: string;
  volunteer?: Profile;
  role_id?: string;
  role?: VolunteerRole;
  role_requested?: string;
  skills?: string[];
  availability?: string;
  preferred_task_place?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  applied_at: string;
}

export interface VolunteerTask {
  id: string;
  event_id: string;
  volunteer_id?: string;
  assigned_to?: string;
  assignee?: Profile;
  event?: Event;
  title: string;
  description?: string;
  task_role?: string;
  start_time?: string;
  end_time?: string;
  status: 'assigned' | 'todo' | 'in_progress' | 'completed';
  hours: number;
  skills_earned?: string[];
  skills_gained?: string[];
  completed_at?: string;
  created_at: string;
}

export interface SponsorPackage {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  amount: number;
  benefits?: string[];
  visibility_level: 'standard' | 'premium' | 'platinum';
}

export interface SponsorInterest {
  id: string;
  event_id: string;
  sponsor_id: string;
  sponsor?: Profile;
  package_id?: string;
  package?: SponsorPackage;
  event?: Event;
  company_name?: string;
  sponsorship_type?: string;
  contribution_details?: string;
  message?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'rejected';
  created_at: string;
}

export interface BudgetItem {
  id: string;
  event_id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  event?: Event;
  user_id: string;
  user?: Profile;
  certificate_code: string;
  role: string;
  pdf_url?: string;
  issued_at: string;
  /** Cardano attendance proof bound to this certificate */
  tx_hash?: string;
  wallet_address?: string;
  explorer_url?: string;
  check_in_method?: 'manual' | 'qr' | 'cardano';
}

export interface PassportRecord {
  id: string;
  user_id: string;
  event_id: string;
  event?: Event;
  record_type: 'attendance' | 'certificate' | 'volunteer' | 'volunteer_task';
  title: string;
  description?: string;
  skills?: string[];
  hours: number;
  certificate_id?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface SponsorPitchInput {
  eventId: string;
  sponsorType: string;
  companyName: string;
  contactName: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  totalVolunteers: number;
  totalSponsorLeads: number;
  totalCertificates: number;
  budgetBalance: number;
}

// --- Event Tech Track additions -------------------------------------------

// 5. AI Volunteer Recommendation — saved skills + availability per volunteer.
export interface VolunteerProfile {
  user_id: string;
  full_name?: string;
  skills: string[];
  availability: string;
  recommended_roles?: string[];
  updated_at: string;
}

// 6. Gamified Leaderboard — a single points award (from tasks, check-ins, etc.)
export interface VolunteerPointsEntry {
  id: string;
  user_id: string;
  full_name?: string;
  points: number;
  reason: string;
  event_id?: string;
  created_at: string;
}

// Computed leaderboard row (not persisted directly).
export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  rank: number;
  points: number;
  tasksCompleted: number;
  hours: number;
  checkInsHandled: number;
  badges: string[];
}

// 5. A scored volunteer role recommendation.
export interface RoleRecommendation {
  role: string;
  score: number;
  fit: 'Excellent' | 'Strong' | 'Good' | 'Fair';
  reasons: string[];
}

// 3 & 4. AI sponsor tool inputs/outputs.
export interface SponsorProposalInput {
  eventId: string;
  audienceSize: number;
  expectedReach: number;
  sponsorBenefits: string;
}

export interface SponsorPackageTier {
  tier: 'Gold' | 'Silver' | 'Bronze';
  price: number;
  benefits: string[];
}

export interface SponsorMatch {
  category: string;
  sponsorTypes: string[];
  fitScore: number;
  rationale: string;
}

export interface SponsorProposalResult {
  proposal: string;
  emailPitch: string;
  packages: SponsorPackageTier[];
  matches: SponsorMatch[];
}
