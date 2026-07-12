import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { createLocalPosterDataUrl, uploadEventPoster } from '@/lib/eventPosterUpload';
import { ImagePlus, X } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [cardanoAddress, setCardanoAddress] = useState(user?.cardano_address || '');
  const [participationFeeAda, setParticipationFeeAda] = useState('0');
  const [prizePoolAda, setPrizePoolAda] = useState('0');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!posterFile) {
      setPosterPreview('');
      return;
    }
    const objectUrl = URL.createObjectURL(posterFile);
    setPosterPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [posterFile]);

  const handlePosterChange = (file?: File) => {
    setError('');
    if (!file) {
      setPosterFile(null);
      return;
    }
    setPosterFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);

    try {
      let posterUrl: string | null = null;
      if (posterFile) {
        try {
          posterUrl = await uploadEventPoster(posterFile, user.id);
        } catch {
          posterUrl = await createLocalPosterDataUrl(posterFile);
        }
      }
      const wallet = cardanoAddress.trim();
      if (wallet.length >= 20) {
        store.updateProfile(user.id, { cardano_address: wallet });
      }
      const fee = Math.max(0, parseFloat(participationFeeAda) || 0);
      const pool = Math.max(0, parseFloat(prizePoolAda) || 0);
      const created = store.createEvent({
        organizer_id: user.id,
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        description,
        category,
        date,
        start_time: startTime,
        end_time: endTime,
        venue,
        city,
        poster_url: posterUrl,
        max_participants: parseInt(maxParticipants) || 100,
        participation_fee_ada: fee,
        prize_pool_ada: pool,
        status: 'published',
      });
      if (pool > 0) store.setPrizePool(created.id, pool, 'ADA', 'Prize pool (ADA)');
      setSuccess('Event created successfully.');
      navigate('/dashboard/organizer/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Event creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Event">
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">{success}</div>}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Event Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required disabled={submitting}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50"
              placeholder="AI Workshop 2026" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Slug (URL-friendly name)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} disabled={submitting}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50"
              placeholder="ai-workshop-2026" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={submitting}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50 resize-none"
              placeholder="Describe your event..." />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Event Poster</label>
            <p className="text-[10px] text-white/30 mb-2">Upload a poster/banner image for your event. Recommended 1200x700 or 16:9.</p>
            {posterPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={posterPreview} alt="Event poster preview" className="h-52 w-full object-cover" />
                <button type="button" onClick={() => handlePosterChange()} disabled={submitting}
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:text-[#E49B3A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E49B3A]/30 bg-[#E49B3A]/5 px-4 text-center hover:bg-[#E49B3A]/10 transition-colors">
                <ImagePlus className="w-8 h-8 text-[#E49B3A] mb-3" />
                <span className="text-sm font-medium text-white">Choose poster image</span>
                <span className="text-xs text-white/35 mt-1">JPG, PNG, or WEBP under 5MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={submitting}
                  onChange={event => handlePosterChange(event.target.files?.[0])} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50">
                {['Technology', 'Hackathon', 'Education', 'Business', 'Social', 'Sports', 'Arts', 'Other'].map(c => (
                  <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Venue</label>
              <input value={venue} onChange={e => setVenue(e.target.value)} disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50"
                placeholder="Main Auditorium" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} disabled={submitting}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50"
                placeholder="Bengaluru" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Max Participants</label>
            <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} disabled={submitting}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#E49B3A]/50" />
          </div>

          <div className="rounded-xl border border-[#7C3AED]/35 bg-[#7C3AED]/10 p-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Cardano receive wallet</p>
            <p className="text-[11px] leading-5 text-white/55">
              Paste your Preprod receive address (<span className="font-mono">addr_test1…</span>). Sponsors send ADA here after you approve them. Also used for participation fees.
            </p>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Your Cardano wallet address *</label>
              <input
                value={cardanoAddress}
                onChange={e => setCardanoAddress(e.target.value)}
                disabled={submitting}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50"
                placeholder="addr_test1qz…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Participation fee (ADA)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={participationFeeAda}
                  onChange={e => setParticipationFeeAda(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50"
                  placeholder="0 = free"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Prize pool (ADA)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={prizePoolAda}
                  onChange={e => setPrizePoolAda(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="submit" disabled={submitting} className="gold-btn text-sm disabled:opacity-60">
              {submitting ? 'Publishing...' : 'Publish Event'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard/organizer/events')} disabled={submitting} className="ghost-btn text-sm rounded-full">Cancel</button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
