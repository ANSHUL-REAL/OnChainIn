import { useState } from 'react';
import { useParams } from 'react-router';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import store from '@/data/store';
import { Award, BadgeCheck, Calendar, CheckCircle, Clock, Copy, Globe2, Shield, Sparkles, Users, Wrench } from 'lucide-react';

function formatDate(value?: string) {
  if (!value) return 'Verified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Verified';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function recordIcon(type: string) {
  if (type === 'certificate') return Award;
  if (type === 'volunteer' || type === 'volunteer_task') return Users;
  return Calendar;
}

export default function PassportPage() {
  const { username } = useParams<{ username: string }>();
  const [copied, setCopied] = useState(false);
  const profile = store.getProfileByUsername(username || '');
  const records = profile ? store.getUserPassportRecords(profile.id) : [];

  const stats = {
    events: records.filter(r => r.record_type === 'attendance').length,
    hours: records.filter(r => r.record_type === 'volunteer' || r.record_type === 'volunteer_task').reduce((s, r) => s + (r.hours || 0), 0),
    certs: records.filter(r => r.record_type === 'certificate').length,
    skills: new Set(records.flatMap(r => r.skills || [])).size,
  };
  const volunteerRecords = records.filter(r => r.record_type === 'volunteer' || r.record_type === 'volunteer_task');
  const initials = profile?.full_name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (!profile) {
    return (
      <div className="eventos-light-app min-h-screen bg-[#F9F8F1] text-[#14150F]">
        <Navbar />
        <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-[2rem] bg-white border border-[#E7E1D2] p-8 text-center shadow-sm">
            <Shield className="w-12 h-12 text-[#52670F] mx-auto mb-4" />
            <h1 className="text-3xl font-black">Passport not found</h1>
            <p className="text-sm text-[#5E6256] mt-2">No public Proof Passport exists for this username.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="eventos-light-app min-h-screen bg-[#F9F8F1] text-[#14150F] overflow-hidden">
      <Navbar />

      <main className="pt-28 pb-16">
        <section className="relative max-w-[88rem] mx-auto px-4 sm:px-6">
          <div className="passport-aura" />
          <div className="passport-credential">
            <div className="passport-identity">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8BE] bg-white/70 px-4 py-2 text-sm font-black text-[#52670F] shadow-sm">
                  <BadgeCheck className="w-4 h-4" />
                  Verified Proof Passport
                </div>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CFE2A1] bg-white px-4 py-2 text-sm font-black text-[#52670F] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#F6FAE8]"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied' : 'Share Passport'}
                </button>
              </div>

              <div className="mt-9 grid gap-7 lg:grid-cols-[auto_1fr] lg:items-center">
                <div className="passport-photo">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="passport-kicker">Public credential</p>
                  <h1 className="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.04em] sm:text-7xl">{profile.full_name}</h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-[#5E6256]">
                    {profile.bio || 'Verified attendance, certificates, volunteer hours, and earned skills from OnChainIn records.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="passport-chip"><Shield className="h-3.5 w-3.5" /> Organizer verified</span>
                    <span className="passport-chip"><Globe2 className="h-3.5 w-3.5" /> Public record</span>
                    <span className="passport-chip"><Sparkles className="h-3.5 w-3.5" /> Proof only after action</span>
                  </div>
                </div>
              </div>

              <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { icon: Calendar, value: stats.events, label: 'Events attended' },
                  { icon: Clock, value: stats.hours, label: 'Volunteer hours' },
                  { icon: Award, value: stats.certs, label: 'Certificates' },
                  { icon: Wrench, value: stats.skills, label: 'Skills earned' },
                ].map((stat) => (
                  <div key={stat.label} className="passport-stat">
                    <stat.icon className="w-5 h-5" />
                    <p>{stat.value}</p>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="passport-verify">
              <div className="passport-seal">
                <img src="/logo.png" alt="OnChainIn" className="h-10 w-10 object-contain bg-transparent" />
              </div>
              <p className="passport-kicker">What this proves</p>
              <h2>A real event history, not a self-claimed resume line.</h2>
              <p>
                Records appear here only after organizer actions like approved attendance, issued certificates, or verified volunteer task completion.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  'Applications do not become proof automatically',
                  'QR attendance and certificates create verified records',
                  'Volunteer hours and skills appear after completed tasks',
                ].map(item => (
                  <div key={item} className="passport-rule">
                    <CheckCircle className="w-5 h-5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-8">
          {volunteerRecords.length > 0 && (
            <div className="mb-6 rounded-[2rem] border border-[#DCE8BE] bg-[#F6FAE8] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.22em] text-[#6A7D1A] uppercase">Volunteer proof</p>
                  <h2 className="text-2xl sm:text-3xl font-black">Verified contributions</h2>
                </div>
                <p className="text-sm text-[#5E6256] max-w-lg">Completed volunteer tasks are counted as proof records with hours and skills.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-3xl bg-white border border-[#E0E7C7] p-4">
                  <p className="text-3xl font-black text-[#52670F]">{volunteerRecords.length}</p>
                  <p className="text-xs font-bold text-[#5E6256]">Roles completed</p>
                </div>
                <div className="rounded-3xl bg-white border border-[#E0E7C7] p-4">
                  <p className="text-3xl font-black text-[#52670F]">{stats.hours}</p>
                  <p className="text-xs font-bold text-[#5E6256]">Hours contributed</p>
                </div>
                <div className="rounded-3xl bg-white border border-[#E0E7C7] p-4">
                  <p className="text-3xl font-black text-[#52670F]">{stats.skills}</p>
                  <p className="text-xs font-bold text-[#5E6256]">Skills earned</p>
                </div>
              </div>
            </div>
          )}

          <div className="passport-timeline">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-black tracking-[0.22em] text-[#6A7D1A] uppercase">Record timeline</p>
                <h2 className="text-3xl sm:text-4xl font-black">Verified records</h2>
              </div>
              <p className="text-sm text-[#5E6256]">{records.length} public record{records.length === 1 ? '' : 's'}</p>
            </div>

            {records.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#CFE2A1] bg-[#F9F8F1] p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF5D9] border border-[#DCE8BE] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-[#52670F]" />
                </div>
                <h3 className="text-2xl font-black">No verified proof yet</h3>
                <p className="mt-2 text-sm text-[#5E6256] max-w-lg mx-auto">
                  This passport will update after attendance is verified, certificates are issued, or volunteer tasks are completed.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {records.map((record) => {
                  const Icon = recordIcon(record.record_type);
                  return (
                    <article key={record.id} className="group rounded-[1.5rem] border border-[#E7E1D2] bg-[#F9F8F1] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(35,40,20,0.08)] transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0E7C7] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#52670F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-[#EEF5D9] text-[#52670F] font-black capitalize">
                              {record.record_type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-[#14150F]">{record.title}</h3>
                          {record.description && <p className="text-sm text-[#5E6256] mt-1">{record.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {record.event && <span className="text-xs font-bold text-[#5E6256]">{record.event.title}</span>}
                            {record.hours > 0 && <span className="text-xs font-bold text-[#5E6256]">{record.hours}h</span>}
                            <span className="text-xs font-bold text-[#5E6256]">{formatDate(record.verified_at || record.created_at)}</span>
                          </div>
                          {(record.skills || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {record.skills?.map(skill => (
                                <span key={skill} className="text-[10px] px-2 py-1 rounded-full bg-white border border-[#E0E7C7] text-[#52670F] font-bold">{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
