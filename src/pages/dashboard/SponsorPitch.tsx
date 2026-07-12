import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { useSyncedPublishedEvents } from '@/hooks/useSyncedEvents';
import { buildPackages, generateProposal, matchSponsors } from '@/lib/ai/sponsorAI';
import { pushRemote } from '@/lib/persistence';
import { supabase } from '@/lib/supabase';
import type { SponsorProposalResult, SponsorMatch } from '@/types';
import { Wand2, Copy, Check, Download, Sparkles, Target, Crown, Save, Loader2 } from 'lucide-react';

type Tab = 'proposal' | 'matching';

function inr(n: number) { return `Rs.${Math.round(n).toLocaleString('en-IN')}`; }

const tierStyles: Record<string, string> = {
  Gold: 'border-[#E49B3A]/40 bg-[#E49B3A]/5',
  Silver: 'border-white/20 bg-white/[0.03]',
  Bronze: 'border-amber-700/30 bg-amber-700/5',
};

export default function SponsorPitch() {
  const events = useSyncedPublishedEvents();
  const user = store.getCurrentUser();
  const [tab, setTab] = useState<Tab>('proposal');
  const [eventId, setEventId] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [expectedReach, setExpectedReach] = useState('');
  const [benefits, setBenefits] = useState('');
  const [result, setResult] = useState<SponsorProposalResult | null>(null);
  const [matches, setMatches] = useState<SponsorMatch[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const selectedEvent = store.getEventById(eventId);

  const numbers = () => ({
    audience: parseInt(audienceSize) || selectedEvent?.max_participants || 100,
    reach: parseInt(expectedReach) || (parseInt(audienceSize) || selectedEvent?.max_participants || 100) * 12,
  });

  const generate = async () => {
    setError('');
    setSaved(false);
    if (!selectedEvent) { setError('Please select an event first.'); return; }
    const { audience, reach } = numbers();
    setGenerating(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error: fnError } = await supabase.functions.invoke('generate-sponsor-pitch', {
        body: {
          eventTitle: selectedEvent.title,
          eventDescription: selectedEvent.description,
          eventDate: selectedEvent.date,
          venue: selectedEvent.venue,
          city: selectedEvent.city,
          eventCategory: selectedEvent.category,
          audienceSize: audience,
          sponsorType: '',
          sponsorGoal: benefits,
        },
      });
      if (fnError) throw fnError;

      const packages = buildPackages(audience, reach);
      const matches = matchSponsors({ event: selectedEvent, audienceSize: audience, expectedReach: reach });
      const proposal = [
        `SPONSORSHIP PROPOSAL\n${selectedEvent.title}`,
        data?.sponsorPackageSuggestion ? `PACKAGE SUGGESTION\n${data.sponsorPackageSuggestion}` : '',
        Array.isArray(data?.valuePoints) && data.valuePoints.length
          ? `VALUE POINTS\n${data.valuePoints.map((point: string) => `- ${point}`).join('\n')}`
          : '',
        data?.whatsappPitch ? `WHATSAPP PITCH\n${data.whatsappPitch}` : '',
      ].filter(Boolean).join('\n\n');

      setResult({
        proposal: proposal || generateProposal({ event: selectedEvent, audienceSize: audience, expectedReach: reach, sponsorBenefits: benefits }).proposal,
        emailPitch: data?.emailPitch || generateProposal({ event: selectedEvent, audienceSize: audience, expectedReach: reach, sponsorBenefits: benefits }).emailPitch,
        packages,
        matches,
      });
    } catch {
      setResult(generateProposal({ event: selectedEvent, audienceSize: audience, expectedReach: reach, sponsorBenefits: benefits }));
      setError('Groq sponsor AI was unavailable, so OnChainIn generated a local proposal fallback.');
    } finally {
      setGenerating(false);
    }
  };

  const runMatching = () => {
    setError('');
    if (!selectedEvent) { setError('Please select an event first.'); return; }
    const { audience, reach } = numbers();
    setMatches(matchSponsors({ event: selectedEvent, audienceSize: audience, expectedReach: reach }));
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadText = (text: string, name: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const saveProposal = async () => {
    if (!selectedEvent || !result) return;
    setSaving(true);
    const { audience, reach } = numbers();
    const res = await pushRemote('etrack_sponsor_proposals', {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      event_id: selectedEvent.id,
      created_by: user?.id || '',
      event_title: selectedEvent.title,
      audience_size: audience,
      expected_reach: reach,
      sponsor_benefits: benefits,
      proposal: result.proposal,
      email_pitch: result.emailPitch,
      packages: result.packages,
      matches: result.matches,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    if (!res.ok) setError('Saved locally. Supabase save unavailable (apply migration 005 to enable cloud save).');
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50';

  return (
    <DashboardLayout title="AI Sponsor Tools">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('proposal')} className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${tab === 'proposal' ? 'gold-btn' : 'ghost-btn rounded-full'}`}>
          <Sparkles className="w-4 h-4" /> Proposal Generator
        </button>
        <button onClick={() => setTab('matching')} className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${tab === 'matching' ? 'gold-btn' : 'ghost-btn rounded-full'}`}>
          <Target className="w-4 h-4" /> Sponsor Matching
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Shared input form */}
        <div className="glass-card rounded-xl p-5 sm:p-6 space-y-4 self-start">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Select Event</label>
            <select value={eventId} onChange={e => setEventId(e.target.value)} className={inputCls}>
              <option value="" className="bg-[#1a1a1a]">Choose an event</option>
              {events.map(e => <option key={e.id} value={e.id} className="bg-[#1a1a1a]">{e.title}</option>)}
            </select>
          </div>
          {selectedEvent && (
            <p className="text-[11px] text-white/40 -mt-1">
              {selectedEvent.category} · {selectedEvent.date} · {selectedEvent.venue}, {selectedEvent.city}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Audience size</label>
              <input type="number" value={audienceSize} onChange={e => setAudienceSize(e.target.value)} className={inputCls} placeholder={String(selectedEvent?.max_participants || 200)} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Expected reach</label>
              <input type="number" value={expectedReach} onChange={e => setExpectedReach(e.target.value)} className={inputCls} placeholder="e.g. 5000" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Sponsor benefits / what you offer</label>
            <textarea value={benefits} onChange={e => setBenefits(e.target.value)} rows={4} className={`${inputCls} resize-none`}
              placeholder={'One per line, e.g.\nLogo on stage backdrop\nBooth in main hall\nAccess to attendee list'} />
          </div>
          {tab === 'proposal' ? (
            <button onClick={() => void generate()} disabled={generating} className="gold-btn w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? 'Generating with Groq...' : 'Generate Proposal'}
            </button>
          ) : (
            <button onClick={runMatching} className="gold-btn w-full flex items-center justify-center gap-2"><Target className="w-4 h-4" /> Find Matching Sponsors</button>
          )}
        </div>

        {/* Output */}
        <div className="space-y-4">
          {tab === 'proposal' && !result && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Fill in the details and generate a professional proposal, email pitch, and Gold/Silver/Bronze packages.</p>
            </div>
          )}

          {tab === 'proposal' && result && (
            <>
              {/* Packages */}
              <div className="grid sm:grid-cols-3 gap-3">
                {result.packages.map((p) => (
                  <div key={p.tier} className={`rounded-xl border p-3 ${tierStyles[p.tier]}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {p.tier === 'Gold' && <Crown className="w-4 h-4 text-[#E49B3A]" />}
                      <p className="text-sm font-bold text-white">{p.tier}</p>
                    </div>
                    <p className="text-base font-bold text-[#E49B3A] mb-2">{inr(p.price)}</p>
                    <ul className="space-y-1">
                      {p.benefits.slice(0, 4).map((b, i) => <li key={i} className="text-[10px] text-white/50 flex gap-1"><Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              {[
                { key: 'proposal', label: 'Sponsorship Proposal', content: result.proposal },
                { key: 'email', label: 'Email Pitch', content: result.emailPitch },
              ].map(({ key, label, content }) => (
                <div key={key} className="glass-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-white">{label}</p>
                    <div className="flex gap-3">
                      <button onClick={() => copy(content, key)} className="text-[10px] flex items-center gap-1 text-white/40 hover:text-[#E49B3A]">
                        {copied === key ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                      <button onClick={() => downloadText(content, `${key}-${selectedEvent?.slug || 'event'}.txt`)} className="text-[10px] flex items-center gap-1 text-white/40 hover:text-[#E49B3A]">
                        <Download className="w-3 h-3" /> .txt
                      </button>
                    </div>
                  </div>
                  <pre className="text-[11px] text-white/60 whitespace-pre-wrap bg-white/[0.02] rounded p-3 max-h-48 overflow-y-auto font-sans">{content}</pre>
                </div>
              ))}

              <button onClick={saveProposal} disabled={saving} className="ghost-btn rounded-full text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved' : 'Save to Supabase'}
              </button>
            </>
          )}

          {tab === 'matching' && !matches && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Target className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Get practical, explainable sponsor category and type suggestions based on your event type, audience, and reach.</p>
            </div>
          )}

          {tab === 'matching' && matches && (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.category} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{m.category}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">{m.fitScore}% fit</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E49B3A] to-emerald-400" style={{ width: `${m.fitScore}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {m.sponsorTypes.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E49B3A]/10 text-[#E49B3A]">{t}</span>)}
                  </div>
                  <p className="text-[11px] text-white/50">{m.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
