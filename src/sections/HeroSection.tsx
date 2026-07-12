import { useNavigate } from 'react-router';
import { ArrowRight, Award, Handshake, Play, QrCode, ShieldCheck, Sparkles, Users } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, label: 'Live registrations', value: '430' },
    { icon: QrCode, label: 'QR check-ins', value: '276' },
    { icon: Award, label: 'Certificates ready', value: '276' },
    { icon: Handshake, label: 'Sponsor leads', value: '14' },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.jpg" alt="Warm event venue" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120703]/92 via-[#120703]/52 to-[#120703]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080402] via-transparent to-[#160905]/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(247,197,107,0.26),transparent_28rem)]" />
      </div>

      <div className="section-shell relative z-10 py-16 sm:py-20 w-full">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          <div className="reveal-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F7C56B]/30 bg-[#2B1308]/42 backdrop-blur-md mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F7C56B] animate-pulse" />
              <span className="text-xs font-bold text-[#F7C56B] tracking-[0.22em] uppercase">Cardano · Verified Event Operations</span>
            </div>

            <h1 className="editorial-heading text-5xl sm:text-6xl lg:text-7xl text-[#FFF8E9] mb-6 max-w-4xl">
              Manage events.
              <span className="block">Verify participation.</span>
              <span className="block text-gradient-gold">Build proof of work.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#F8EAD2]/72 leading-8 mb-8 max-w-2xl">
              OnChainIn helps colleges, communities, and organizers manage registrations, volunteers, sponsors, budgets, QR attendance, certificates, and{' '}
              <strong className="text-[#FFF8E9]">immutable Cardano attendance proofs</strong> from one polished command layer.
            </p>

            <div className="flex flex-wrap gap-4 mb-9">
              <button onClick={() => navigate('/signup')} className="gold-btn flex items-center gap-2">
                Sign Up <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/login')} className="ghost-btn flex items-center gap-2 rounded-full">
                Sign In
              </button>
              <button onClick={() => navigate('/events')} className="ghost-btn flex items-center gap-2 rounded-full">
                <Play className="w-4 h-4" /> Browse Events
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#F8EAD2]/48">
              <span>Trusted by 300+ colleges and communities</span>
              <span className="hidden sm:block h-px w-10 bg-[#F7C56B]/30" />
              {['MIT', 'Stanford', 'IIT', 'IIIT'].map((college) => (
                <span key={college} className="rounded-full border border-[#F7C56B]/18 bg-[#160905]/45 px-3 py-1 font-semibold text-[#FFF8E9]/64">
                  {college}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block min-h-[520px]">
            <div className="absolute right-0 top-4 w-[82%] rounded-[2rem] border border-[#F7C56B]/18 bg-[#1C0D06]/45 p-5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#F7C56B]/10 pb-4">
                <div>
                  <p className="section-kicker text-[0.65rem]">Tonight's Control Room</p>
                  <h3 className="text-xl font-bold text-[#FFF8E9] mt-1">AI Workshop 2026</h3>
                </div>
                <span className="rounded-full bg-emerald-400/14 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                {stats.map((stat, index) => (
                  <div key={stat.label} className={`glass-card hover-lift rounded-2xl p-4 ${index === 1 ? 'mt-6' : ''}`}>
                    <stat.icon className="w-5 h-5 text-[#F7C56B] mb-5" />
                    <p className="text-3xl font-extrabold text-[#FFF8E9]">{stat.value}</p>
                    <p className="text-xs text-[#F8EAD2]/52 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute left-8 top-20 glass-card border-glow rounded-2xl p-4 animate-float max-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F7C56B]/14 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-[#F7C56B]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#F8EAD2]/42">Gate A</p>
                  <p className="text-sm font-semibold text-[#FFF8E9]">Scan and verify</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 left-0 glass-card rounded-2xl p-4 animate-float-delayed max-w-[255px]">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#F7C56B] mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#FFF8E9]">Certificates are generated after verified attendance.</p>
                  <p className="text-xs text-[#F8EAD2]/48 mt-2">No manual follow-up, no guessing.</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-12 glass-card rounded-full px-4 py-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-semibold text-[#FFF8E9]">Proof Passport ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
