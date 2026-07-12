import { useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Plus, Handshake } from 'lucide-react';

export default function EventSponsors() {
  const { id } = useParams<{ id: string }>();
  const event = store.getEventById(id || '');
  if (!event) return <DashboardLayout title="Sponsors"><p className="text-white/40">Event not found</p></DashboardLayout>;

  const packages = store.getEventSponsorPackages(event.id);
  const interests = store.getEventSponsorInterests(event.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [level, setLevel] = useState<'standard' | 'premium' | 'platinum'>('standard');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    store.createSponsorPackage({ event_id: event.id, title, description: desc, amount: parseFloat(amount) || 0, benefits: [], visibility_level: level });
    setShowForm(false); setTitle(''); setDesc(''); setAmount(''); setLevel('standard');
  };

  const updateStatus = (interestId: string, status: 'new' | 'contacted' | 'confirmed' | 'rejected') => {
    store.updateSponsorInterest(interestId, { status });
  };

  return (
    <DashboardLayout title="Sponsors">
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Packages</h2>
            <button onClick={() => setShowForm(!showForm)} className="text-[10px] px-2 py-1 rounded bg-[#E49B3A]/20 text-[#E49B3A] flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="glass-card rounded-lg p-3 mb-3 space-y-2">
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Package name" className="w-full bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount" className="w-24 bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
                <select value={level} onChange={e => setLevel(e.target.value as any)} className="flex-1 bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#E49B3A]/50">
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <button type="submit" className="gold-btn text-[10px] py-1.5 px-3">Create</button>
            </form>
          )}

          {packages.length === 0 ? <p className="text-sm text-white/30 text-center py-4">No packages yet</p> : (
            <div className="space-y-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="glass-card rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{pkg.title}</p>
                    <span className="text-sm font-bold text-[#E49B3A]">Rs.{pkg.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{pkg.description}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${pkg.visibility_level === 'platinum' ? 'bg-purple-500/20 text-purple-400' : pkg.visibility_level === 'premium' ? 'bg-[#E49B3A]/20 text-[#E49B3A]' : 'bg-white/5 text-white/30'}`}>{pkg.visibility_level}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Sponsor Interests ({interests.length})</h2>
          {interests.length === 0 ? <p className="text-sm text-white/30 text-center py-4">No interests yet</p> : (
            <div className="space-y-2">
              {interests.map((si) => (
                <div key={si.id} className="glass-card rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center"><Handshake className="w-4 h-4 text-rose-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{si.company_name || 'Unknown'}</p>
                      <p className="text-[10px] text-white/30">{si.sponsor?.full_name} &bull; {si.sponsorship_type || si.package?.title || 'General Sponsorship'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${si.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : si.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{si.status}</span>
                  </div>
                  <p className="text-[10px] text-white/20 mt-1">{si.contribution_details || si.message}</p>
                  {si.status === 'new' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateStatus(si.id, 'contacted')} className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-400">Mark Contacted</button>
                      <button onClick={() => updateStatus(si.id, 'confirmed')} className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Confirm</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
