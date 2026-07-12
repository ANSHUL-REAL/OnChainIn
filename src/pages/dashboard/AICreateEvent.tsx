import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, Calendar, CheckCircle2, ClipboardList, Handshake, Loader2, QrCode, Sparkles, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import type { EventFormField } from '@/types';
import { isCloudEnabled, requireSupabase } from '@/lib/supabase';
import { generateEventDraftWithGroq, isGroqConfigured } from '@/lib/ai/groqEventDraft';

type DraftField = Omit<EventFormField, 'id' | 'event_id' | 'created_at'>;

type EventDraft = {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  city: string;
  max_participants: number;
  formFields: DraftField[];
  volunteerRoles: Array<{ role_name: string; description: string; required_count: number; skills: string[] }>;
  sponsorPackages: Array<{ title: string; description: string; benefits: string[] }>;
  budgetCategories: Array<{ type: 'income' | 'expense'; title: string }>;
  certificateSetup: string;
  certificateEnabled: boolean;
  analysis: {
    foundEventType: string;
    foundDate: boolean;
    warnings: string[];
  };
};

type EdgeRegistrationField = {
  label?: string;
  field_type?: DraftField['field_type'];
  required?: boolean;
  options?: string[];
};

type EdgeEventDraft = {
  title?: string;
  category?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  city?: string;
  max_participants?: number;
  registration_fields?: EdgeRegistrationField[];
  volunteer_roles?: Array<{ role?: string; description?: string }>;
  sponsor_packages?: Array<{ title?: string; description?: string; benefits?: string[] }>;
  budget_categories?: Array<{ type?: 'income' | 'expense'; title?: string }>;
  certificate_enabled?: boolean;
  warnings?: string[];
};

const defaultPrompt = 'Create a 100-seat AI workshop in Hyderabad with registration form, volunteer support, QR check-in, and certificates.';
const AI_PROMPT_KEY = 'OnChainIn_ai_prompt';
const timezone = 'Asia/Kolkata';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultEventDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return formatDateInput(date);
}

const monthNames: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parsePromptDate(prompt: string) {
  const lower = prompt.toLowerCase();
  const match = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/)
    || lower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!match) return '';

  const first = match[1];
  const second = match[2];
  const day = Number(/\d/.test(first) ? first : second);
  const monthKey = /\d/.test(first) ? second : first;
  const month = monthNames[monthKey];
  if (!Number.isFinite(day) || month === undefined) return '';

  const today = new Date();
  let candidate = new Date(today.getFullYear(), month, day);
  if (candidate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    candidate = new Date(today.getFullYear() + 1, month, day);
  }
  return formatDateInput(candidate);
}

function inferPromptBasics(prompt: string) {
  const lower = prompt.toLowerCase();
  if (/\b(pubg|bgmi|free fire|esports|gaming)\b/.test(lower)) {
    return {
      title: lower.includes('bgmi') ? 'BGMI Tournament' : 'PUBG Tournament',
      category: 'Gaming / Esports',
      seats: 50,
      description: 'PUBG Tournament is a competitive gaming event where players compete in structured matches with organizer-reviewed registrations. Approved participants receive access details and QR-based check-in, while winners and verified participation can later become certificates and Proof Passport records.',
    };
  }
  if (/\b(ai|machine learning|gen ai|artificial intelligence)\b/.test(lower)) {
    return {
      title: 'AI Workshop',
      category: 'Technology / AI',
      seats: 100,
      description: 'AI Workshop is a practical learning event for participants who want hands-on exposure to modern AI concepts, tools, and workflows. Registrations require organizer approval, approved attendees receive QR check-in access, and verified participation can become certificates and Proof Passport records.',
    };
  }
  if (/\b(hackathon|coding)\b/.test(lower)) {
    return {
      title: lower.includes('24') ? '24-Hour Hackathon' : 'Hackathon',
      category: 'Hackathon / Technology',
      seats: 200,
      description: 'Hackathon is a build-focused event where participants work on ideas, prototypes, and problem-solving in a structured event flow. Organizer approval controls participant access, and verified attendance can support certificates and Proof Passport records.',
    };
  }
  if (/\b(dance|music|cultural|fest)\b/.test(lower)) {
    return {
      title: 'Cultural Event',
      category: 'Cultural',
      seats: 100,
      description: 'Cultural Event brings participants together for a curated program with organizer-approved registrations, smooth event check-in, and verified participation records through OnChainIn.',
    };
  }
  return {
    title: 'OnChainIn Event',
    category: 'General',
    seats: 100,
    description: 'This event is organized with registration approval, check-in management, and participant verification through OnChainIn. Approved attendees receive event access details, and verified participation can later support certificates and Proof Passport records.',
  };
}

function generateLocalDraftFromPrompt(prompt: string, reason?: string): EventDraft {
  const basics = inferPromptBasics(prompt);
  const lower = prompt.toLowerCase();
  const seats = Number(lower.match(/\b(\d{1,5})\s*(?:seat|seats|people|students|participants|players)\b/)?.[1]) || basics.seats;
  const city = ['hyderabad', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'pune', 'chennai'].find(name => lower.includes(name)) || '';
  const parsedDate = parsePromptDate(prompt);
  const eventDate = parsedDate || getDefaultEventDate();

  return {
    title: basics.title,
    slug: slugify(`${basics.title}-${Date.now().toString().slice(-4)}`),
    description: basics.description,
    category: basics.category,
    date: eventDate,
    start_time: '10:00',
    end_time: '16:00',
    venue: 'To be announced',
    city: city ? city[0].toUpperCase() + city.slice(1) : '',
    max_participants: seats,
    formFields: [
      { label: 'Full Name', field_type: 'text', required: true, options: [], sort_order: 0 },
      { label: 'Email', field_type: 'email', required: true, options: [], sort_order: 1 },
      { label: 'Phone Number', field_type: 'phone', required: true, options: [], sort_order: 2 },
      { label: 'College / Organization', field_type: 'text', required: false, options: [], sort_order: 3 },
      { label: 'Why do you want to attend?', field_type: 'textarea', required: false, options: [], sort_order: 4 },
    ],
    volunteerRoles: [{ role_name: basics.category.includes('Gaming') ? 'Tournament Support' : 'Event Support', description: 'Support registrations, coordination, and event-day operations.', required_count: 2, skills: [] }],
    sponsorPackages: [{ title: 'Community Sponsor', description: 'Visibility across event communication and organizer follow-up.', benefits: ['Logo visibility', 'Mention in event updates'] }],
    budgetCategories: [
      { type: 'income', title: 'Registration or sponsorship income' },
      { type: 'expense', title: 'Venue and operations' },
      { type: 'expense', title: 'Certificates and logistics' },
    ],
    certificateEnabled: true,
    certificateSetup: 'Certificates are prepared for attended participants after organizer verification.',
    analysis: {
      foundEventType: basics.title,
      foundDate: Boolean(parsedDate),
      warnings: [
        ...(parsedDate ? [] : ['Date was not found. OnChainIn used an editable upcoming demo date.']),
        ...(reason ? [`AI backend failed, so OnChainIn used a local prompt parser: ${reason}`] : []),
      ],
    },
  };
}

function toDraft(edgeDraft: EdgeEventDraft): EventDraft {
  const title = (edgeDraft.title || '').trim();
  const category = (edgeDraft.category || '').trim();
  const fields = Array.isArray(edgeDraft.registration_fields) ? edgeDraft.registration_fields : [];
  const foundDate = Boolean(edgeDraft.event_date);
  const warnings = [
    ...(Array.isArray(edgeDraft.warnings) ? edgeDraft.warnings.filter(Boolean) : []),
    ...(foundDate ? [] : ['Date was not found. OnChainIn used an editable upcoming demo date.']),
  ];

  return {
    title,
    slug: slugify(`${title || 'event'}-${Date.now().toString().slice(-4)}`),
    description: edgeDraft.description || '',
    category,
    date: edgeDraft.event_date || getDefaultEventDate(),
    start_time: edgeDraft.start_time || '10:00',
    end_time: edgeDraft.end_time || '16:00',
    venue: edgeDraft.venue || 'To be announced',
    city: edgeDraft.city || '',
    max_participants: Number(edgeDraft.max_participants) || 0,
    formFields: fields.map((field, index) => ({
      label: field.label || `Question ${index + 1}`,
      field_type: field.field_type || 'text',
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options : [],
      sort_order: index,
    })),
    volunteerRoles: (edgeDraft.volunteer_roles || []).map(role => ({
      role_name: role.role || 'Volunteer',
      description: role.description || '',
      required_count: 1,
      skills: [],
    })),
    sponsorPackages: (edgeDraft.sponsor_packages || []).map(pkg => ({
      title: pkg.title || 'Sponsor Package',
      description: pkg.description || '',
      benefits: Array.isArray(pkg.benefits) ? pkg.benefits : [],
    })),
    budgetCategories: (edgeDraft.budget_categories || []).map(category => ({
      type: category.type === 'income' ? 'income' : 'expense',
      title: category.title || 'Budget item',
    })),
    certificateEnabled: edgeDraft.certificate_enabled !== false,
    certificateSetup: edgeDraft.certificate_enabled === false
      ? 'Certificates are disabled for this draft.'
      : 'Certificates are prepared for attended participants after organizer verification.',
    analysis: {
      foundEventType: title || 'Review needed',
      foundDate,
      warnings,
    },
  };
}

function isMissingSupabaseColumnError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('column') && (message.includes('does not exist') || message.includes('schema cache'));
}

/**
 * 1) Direct Groq (VITE_GROQ_API_KEY) — preferred for local + Vercel
 * 2) Supabase Edge Function generate-event-draft — optional
 * 3) Caller falls back to local parser
 */
async function generateDraftFromAI(prompt: string) {
  const currentDate = getCurrentDate();

  // Prefer real Groq API key in env
  if (isGroqConfigured()) {
    const data = await generateEventDraftWithGroq(prompt, { currentDate, timezone });
    const draft = toDraft(data as EdgeEventDraft);
    draft.analysis.warnings = [
      ...(draft.analysis.warnings || []),
      'Generated with Groq AI — review every field before publishing.',
    ];
    return draft;
  }

  // Optional Supabase Edge Function (if you deployed one with GROQ_API_KEY secret)
  if (isCloudEnabled()) {
    try {
      const supabase = requireSupabase();
      const { data, error } = await supabase.functions.invoke<EdgeEventDraft>('generate-event-draft', {
        body: { prompt, currentDate, timezone },
      });
      if (error) throw new Error(error.message || 'Edge function failed');
      if (!data) throw new Error('Edge function returned no draft');
      return toDraft(data);
    } catch (edgeErr) {
      const msg = edgeErr instanceof Error ? edgeErr.message : String(edgeErr);
      throw new Error(
        `No VITE_GROQ_API_KEY and edge AI failed (${msg}). Add VITE_GROQ_API_KEY to .env from https://console.groq.com/keys`,
      );
    }
  }

  throw new Error(
    'Add VITE_GROQ_API_KEY to .env (free key at https://console.groq.com/keys), then restart npm run dev / redeploy Vercel.',
  );
}

async function saveDraftToSupabase(draft: EventDraft) {
  const supabase = requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) {
    throw new Error('Creating events in Supabase requires a real Supabase Auth organizer session. The current one-click demo login is local only.');
  }

  const eventPayload = {
    organizer_id: authData.user.id,
    title: draft.title.trim(),
    slug: draft.slug || slugify(draft.title),
    description: draft.description,
    category: draft.category || 'General',
    event_date: draft.date,
    start_time: draft.start_time || null,
    end_time: draft.end_time || null,
    venue: draft.venue || null,
    city: draft.city || null,
    poster_url: null,
    max_participants: draft.max_participants,
    status: 'published',
  };

  let { data: event, error: eventError } = await supabase
    .from('events')
    .insert(eventPayload)
    .select('id')
    .single();

  if (isMissingSupabaseColumnError(eventError)) {
    const { event_date, ...payloadWithDate } = eventPayload;
    ({ data: event, error: eventError } = await supabase
      .from('events')
      .insert({ ...payloadWithDate, date: event_date })
      .select('id')
      .single());
  }

  if (eventError) throw new Error(eventError.message);
  if (!event?.id) throw new Error('Supabase did not return the created event id.');

  if (draft.formFields.length > 0) {
    const { error: fieldsError } = await supabase
      .from('event_form_fields')
      .insert(draft.formFields.map(field => ({
        event_id: event.id,
        label: field.label,
        field_type: field.field_type,
        required: field.required,
        options: field.options,
        sort_order: field.sort_order,
      })));

    if (fieldsError) throw new Error(fieldsError.message);
  }

  return event.id as string;
}

function saveDraftToDemoStore(draft: EventDraft, organizerId: string, forcedEventId?: string) {
  const eventInput = {
    organizer_id: organizerId,
    title: draft.title.trim(),
    slug: draft.slug || slugify(draft.title),
    description: draft.description,
    category: draft.category || 'General',
    date: draft.date,
    start_time: draft.start_time,
    end_time: draft.end_time,
    venue: draft.venue,
    city: draft.city,
    poster_url: null,
    max_participants: draft.max_participants,
    status: 'published',
  } as const;

  const event = forcedEventId
    ? store.upsertEvent({ ...eventInput, id: forcedEventId, created_at: new Date().toISOString() })
    : store.createEvent(eventInput);

  store.saveEventFormFields(event.id, draft.formFields);
  return event.id;
}

export default function AICreateEvent() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pendingPrompt = localStorage.getItem(AI_PROMPT_KEY);
    if (pendingPrompt) {
      setPrompt(pendingPrompt);
      void generateDraft(pendingPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outputItems = useMemo(() => [
    { icon: ClipboardList, label: 'Registration form generated' },
    { icon: CheckCircle2, label: 'Approval flow enabled' },
    { icon: QrCode, label: 'QR check-in ready' },
    { icon: Users, label: 'Volunteer roles suggested' },
    { icon: Handshake, label: 'Sponsor packages suggested' },
    { icon: Calendar, label: 'Certificate setup prepared' },
  ], []);

  const generateDraft = async (promptOverride = prompt) => {
    setError('');
    const promptToGenerate = promptOverride.trim();
    if (!promptToGenerate) {
      setError('Describe the event you want to create.');
      return;
    }
    setLoading(true);
    try {
      const nextDraft = await generateDraftFromAI(promptToGenerate);
      setDraft(nextDraft);
      setError('');
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'AI event generation failed.';
      // Local heuristic draft so organizers can still continue, with clear AI status
      setDraft(generateLocalDraftFromPrompt(promptToGenerate, reason));
      setError(reason);
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleCreate = async () => {
    setError('');
    if (!user) {
      navigate('/login');
      return;
    }
    if (!draft) {
      setError('Generate an event draft first.');
      return;
    }
    if (!draft.title.trim() || !draft.date) {
      setError('Event title and date are required.');
      return;
    }

    setSaving(true);
    try {
      const eventId = saveDraftToDemoStore(draft, user.id);
      localStorage.removeItem(AI_PROMPT_KEY);
      navigate(`/dashboard/organizer/events/${eventId}`);

      void saveDraftToSupabase(draft).catch(() => {
        // Demo access is local-first. Supabase mirroring needs real auth/RLS support.
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Event creation failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="AI Create Event">
      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <section className="rounded-[2rem] bg-white border border-[#E7E1D2] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-full bg-[#EEF5D9] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#5C7415]" />
            </span>
            <div>
              <p className="text-base font-black text-[#14150F]">Create an event by chatting</p>
              <p className="text-xs text-[#5E6256]">
                {isGroqConfigured()
                  ? 'Groq API key detected — real AI drafts enabled.'
                  : 'Add VITE_GROQ_API_KEY in .env (console.groq.com) then restart for real AI drafts.'}
              </p>
            </div>
          </div>
          {!isGroqConfigured() && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Without a Groq key, generation uses a local template fallback. Get a free key at{' '}
              <a className="font-bold underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                console.groq.com/keys
              </a>
              , put it in <code className="font-mono">.env</code> as <code className="font-mono">VITE_GROQ_API_KEY=gsk_...</code>
            </div>
          )}

          <div className="rounded-[1.5rem] border border-[#E7E1D2] bg-[#F7F6EB] p-4 mb-4">
            <label className="text-xs font-black tracking-wide text-[#6A7D1A] mb-2 block">Describe your event</label>
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              rows={6}
              className="w-full bg-transparent text-sm text-[#14150F] leading-6 placeholder:text-[#9AA08D] focus:outline-none resize-none"
              placeholder="Create a 100-seat AI workshop in Hyderabad..."
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => void generateDraft()} disabled={loading} className="gold-btn text-sm disabled:opacity-60 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Event Draft
            </button>
            <button onClick={() => navigate('/dashboard/organizer/events/new')} className="ghost-btn rounded-full text-sm">
              Manual Create Event
            </button>
          </div>

          {draft && (
            <div className="mt-6 rounded-[1.5rem] border border-[#DCE8BE] bg-[#EEF5D9] p-4">
              <p className="text-sm font-black text-[#52670F]">Event draft generated from your prompt.</p>
              <p className="mt-1 mb-3 text-xs text-[#5E6256]">Please review and edit before creating.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {outputItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white border border-[#E7E1D2] px-3 py-2">
                    <item.icon className="w-3.5 h-3.5 text-[#52670F]" />
                    <span className="text-xs font-semibold text-[#424638]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-white border border-[#E7E1D2] p-5 sm:p-6 shadow-sm">
          {!draft ? (
            <div className="min-h-[30rem] flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-[#52670F]/35 mb-4" />
              <p className="text-lg font-black text-[#14150F]">Your editable draft will appear here.</p>
              <p className="text-sm text-[#5E6256] mt-2 max-w-md">OnChainIn will generate event fields, registration form, approval settings, volunteer roles, sponsor suggestions, budget categories, and certificate setup.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-[#DCE8BE] bg-[#F3F8E3] p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#52670F]">Event draft generated from your prompt.</p>
                    <p className="mt-1 text-xs text-[#5E6256]">Please review and edit every field before creating the event.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white border border-[#DCE8BE] px-3 py-1 text-xs font-bold text-[#52670F]">
                      Found event type: {draft.analysis.foundEventType}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      draft.analysis.foundDate ? 'bg-white border-[#DCE8BE] text-[#52670F]' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {draft.analysis.foundDate ? 'Found date' : 'Missing date'}
                    </span>
                  </div>
                </div>
                {draft.analysis.warnings.length > 0 && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {draft.analysis.warnings.map(warning => (
                      <p key={warning} className="rounded-xl bg-white/75 border border-[#E7E1D2] px-3 py-2 text-xs text-[#5E6256]">
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Event Title</span>
                  <input value={draft.title} onChange={event => updateDraft('title', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Category</span>
                  <input value={draft.category} onChange={event => updateDraft('category', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-[#5E6256] mb-1.5 block">Description</span>
                <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} rows={4}
                  className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50 resize-none" />
              </label>

              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Date</span>
                  <input type="date" value={draft.date} onChange={event => updateDraft('date', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Start</span>
                  <input type="time" value={draft.start_time} onChange={event => updateDraft('start_time', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">End</span>
                  <input type="time" value={draft.end_time} onChange={event => updateDraft('end_time', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block sm:col-span-1">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Venue</span>
                  <input value={draft.venue} onChange={event => updateDraft('venue', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">City</span>
                  <input value={draft.city} onChange={event => updateDraft('city', event.target.value)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
                <label className="block">
                  <span className="text-xs text-[#5E6256] mb-1.5 block">Seats</span>
                  <input type="number" value={draft.max_participants} onChange={event => updateDraft('max_participants', Number(event.target.value) || 0)}
                    className="w-full bg-[#F7F6EB] border border-[#E7E1D2] rounded-xl py-2.5 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#52670F]/50" />
                </label>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 pt-2">
                <div className="rounded-[1.25rem] border border-[#E7E1D2] bg-[#F9F8F1] p-4">
                  <p className="text-sm font-black text-[#14150F] mb-3">Registration Form</p>
                  <div className="space-y-2">
                    {draft.formFields.map(field => (
                      <div key={field.label} className="flex items-center justify-between rounded-xl border border-[#E7E1D2] bg-[#F7F6EB] px-3 py-2">
                        <span className="text-xs font-semibold text-[#424638]">{field.label}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5E6256]">{field.required ? 'required' : 'optional'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[#E7E1D2] bg-[#F9F8F1] p-4">
                  <p className="text-sm font-black text-[#14150F] mb-3">Support Setup</p>
                  <div className="space-y-3 text-xs leading-6 text-[#5E6256]">
                    <p><span className="font-black text-[#52670F]">Volunteer role suggestions:</span> {draft.volunteerRoles.length ? draft.volunteerRoles.map(role => role.role_name).join(', ') : 'No volunteer roles suggested'}</p>
                    <p><span className="font-black text-[#52670F]">Sponsor package suggestions:</span> {draft.sponsorPackages.length ? draft.sponsorPackages.map(pkg => pkg.title).join(', ') : 'No sponsor packages suggested'}</p>
                    <p><span className="font-black text-[#52670F]">Budget categories:</span> {draft.budgetCategories.length ? draft.budgetCategories.map(item => `${item.type}: ${item.title}`).join(', ') : 'No budget categories suggested'}</p>
                    <p><span className="font-black text-[#52670F]">Certificate:</span> {draft.certificateSetup}</p>
                    <p className="text-[11px] font-semibold text-[#5E6256]">Suggestions are shown for review and are not saved automatically.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap gap-3">
                <button onClick={() => void handleCreate()} disabled={saving} className="gold-btn text-sm disabled:opacity-60">
                  {saving ? 'Creating Event...' : 'Create Event'}
                </button>
                <button onClick={() => void generateDraft()} className="ghost-btn rounded-full text-sm">Regenerate</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
