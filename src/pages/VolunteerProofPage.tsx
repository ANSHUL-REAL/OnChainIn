import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Award, CheckCircle, Clock, ExternalLink, Medal, Shield, Sparkles, Trophy, UserCheck, Wrench, XCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { getVolunteerProof } from '@/lib/proofEngine';

export default function VolunteerProofPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const proof = getVolunteerProof(id || '');

  const shareProof = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Volunteer proof link copied.');
    } catch {
      setMessage(url);
    }
  };

  return (
    <div className="eventos-light-app min-h-screen bg-[#F7F6EB] text-[#14150F]">
      <Navbar />
      <main className="max-w-[88rem] mx-auto px-4 sm:px-6 pt-24 pb-16">
        {!proof ? (
          <div className="workspace-empty">
            <XCircle className="w-12 h-12 text-[#52670F]/30 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-[#14150F]">Volunteer proof not found</h1>
            <p className="text-sm text-[#5E6256] mt-2">This page appears after a volunteer has assigned work, points, or verified check-in support.</p>
            <Link to="/dashboard/volunteer/tasks" className="gold-btn inline-flex mt-5">View volunteer tasks</Link>
          </div>
        ) : (
          <section className="passport-credential">
            <div className="passport-identity">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="passport-photo h-36 sm:h-44">
                  <span>{(proof.volunteer?.full_name || 'V').split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
                </div>
                <div className="flex-1">
                  <p className="passport-kicker">Volunteer proof passport</p>
                  <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.055em] leading-[0.92] mt-3">
                    {proof.volunteer?.full_name || 'Volunteer'}
                  </h1>
                  <p className="text-lg text-[#5E6256] mt-4 max-w-2xl">
                    Verified volunteer contributions across tasks, check-in support, skills, points, and organizer-approved event work.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <span className="passport-chip"><Shield className="w-3.5 h-3.5" /> Organizer verified</span>
                    <span className="passport-chip"><Trophy className="w-3.5 h-3.5" /> {proof.points} points</span>
                    <span className="passport-chip"><Medal className="w-3.5 h-3.5" /> {proof.badges[0] || 'Contributor'}</span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: CheckCircle, label: 'Tasks completed', value: proof.completedTasks.length },
                  { icon: Clock, label: 'Hours contributed', value: proof.hours },
                  { icon: UserCheck, label: 'Check-ins handled', value: proof.checkInsHandled },
                  { icon: Wrench, label: 'Skills earned', value: proof.skills.length },
                ].map((item) => (
                  <div key={item.label} className="passport-stat">
                    <item.icon className="w-5 h-5" />
                    <p>{item.value}</p>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="passport-kicker">Verified task records</p>
                    <h2 className="text-2xl font-black text-[#14150F] mt-1">Organizer-confirmed work</h2>
                  </div>
                  <button onClick={shareProof} className="ghost-btn rounded-full inline-flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Share
                  </button>
                </div>
                {message && <p className="text-sm font-semibold text-[#52670F] mb-3">{message}</p>}
                {proof.completedTasks.length === 0 ? (
                  <div className="workspace-empty">
                    <Shield className="w-10 h-10 text-[#52670F]/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#5E6256]">No completed volunteer tasks yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {proof.completedTasks.map((task) => (
                      <div key={task.id} className="passport-rule">
                        <Award className="w-5 h-5" />
                        <div>
                          <p className="font-black text-[#14150F]">{task.title}</p>
                          <p className="text-sm text-[#5E6256] mt-1">{task.event?.title || 'Event'} - {task.hours}h</p>
                          {(task.skills_earned || task.skills_gained || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(task.skills_earned || task.skills_gained || []).map(skill => <span key={skill} className="workspace-chip">{skill}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="passport-verify">
              <div className="passport-seal">
                <Sparkles className="w-11 h-11" />
                <span>Proof engine</span>
              </div>
              <p className="passport-kicker">What this proves</p>
              <h2>Contribution that can be trusted.</h2>
              <p>
                Volunteer proof is generated from completed tasks, check-ins handled, leaderboard points, and verified OnChainIn records.
              </p>
              <div className="space-y-3 mt-6">
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Assigned role history: {proof.tasks.length} task records</div>
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Badge: {proof.badges.join(', ') || 'Contributor'}</div>
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Events contributed: {proof.events.length}</div>
              </div>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
