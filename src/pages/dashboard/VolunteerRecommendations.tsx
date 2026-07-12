import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { recommendRoles } from '@/lib/ai/volunteerAI';
import type { RoleRecommendation } from '@/types';
import { Sparkles, Wand2, Check, Save, Lightbulb } from 'lucide-react';

const fitStyles: Record<RoleRecommendation['fit'], string> = {
  Excellent: 'bg-emerald-500/15 text-emerald-400',
  Strong: 'bg-[#E49B3A]/15 text-[#E49B3A]',
  Good: 'bg-blue-500/15 text-blue-400',
  Fair: 'bg-white/10 text-white/50',
};

const SUGGESTED = ['Communication', 'Technical', 'Social Media', 'Design', 'Leadership', 'Logistics', 'Coding', 'Photography'];

export default function VolunteerRecommendations() {
  const user = store.getCurrentUser();
  const existing = useMemo(() => (user ? store.getVolunteerProfile(user.id) : undefined), [user]);
  const seedSkills = existing?.skills?.join(', ')
    || (user ? store.getVolunteerApplicationsByUser(user.id).flatMap(a => a.skills || []).join(', ') : '');

  const [skills, setSkills] = useState(seedSkills);
  const [availability, setAvailability] = useState(existing?.availability || '');
  const [recs, setRecs] = useState<RoleRecommendation[] | null>(null);
  const [saved, setSaved] = useState(false);

  const skillList = () => skills.split(',').map(s => s.trim()).filter(Boolean);

  const generate = () => {
    setSaved(false);
    setRecs(recommendRoles(skillList(), availability));
  };

  const addSkill = (s: string) => {
    const current = skillList();
    if (current.some(c => c.toLowerCase() === s.toLowerCase())) return;
    setSkills([...current, s].join(', '));
  };

  const saveProfile = () => {
    if (!user) return;
    store.saveVolunteerProfile({
      user_id: user.id,
      full_name: user.full_name,
      skills: skillList(),
      availability,
      recommended_roles: (recs || []).slice(0, 3).map(r => r.role),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50';

  return (
    <DashboardLayout title="Role Recommendations">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="glass-card rounded-xl p-5 sm:p-6 space-y-4 self-start">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#E49B3A]" />
            <h2 className="text-base font-semibold text-white">Tell us your strengths</h2>
          </div>
          <p className="text-xs text-white/40 -mt-2">We’ll recommend the volunteer roles that fit you best, with a clear reason for each.</p>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Your skills</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} className={inputCls} placeholder="Communication, Technical, Design" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => addSkill(s)} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-[#E49B3A] hover:border-[#E49B3A]/40 transition-colors">+ {s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Availability</label>
            <input value={availability} onChange={e => setAvailability(e.target.value)} className={inputCls} placeholder="Full day, morning only, 2 PM – 6 PM" />
          </div>

          <button onClick={generate} className="gold-btn w-full flex items-center justify-center gap-2"><Wand2 className="w-4 h-4" /> Recommend Roles</button>
        </div>

        <div className="space-y-3">
          {!recs && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Add your skills and availability, then get matched to roles like Registration Desk, Technical Support, Social Media, Stage Management, and Coordination.</p>
            </div>
          )}

          {recs && (
            <>
              {recs.map((r, i) => (
                <div key={r.role} className={`glass-card rounded-xl p-4 ${i === 0 ? 'border-[#E49B3A]/40' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{r.role}</p>
                      {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E49B3A]/20 text-[#E49B3A]">Top match</span>}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${fitStyles[r.fit]}`}>{r.fit} · {r.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E49B3A] to-emerald-400" style={{ width: `${r.score}%` }} />
                  </div>
                  <ul className="space-y-1">
                    {r.reasons.map((reason, idx) => (
                      <li key={idx} className="text-[11px] text-white/50 flex gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <button onClick={saveProfile} className="ghost-btn rounded-full text-sm flex items-center gap-2">
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Profile saved' : 'Save my volunteer profile'}
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
