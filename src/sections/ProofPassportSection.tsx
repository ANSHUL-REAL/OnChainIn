import { useNavigate } from 'react-router';
import { ArrowRight, Award, BarChart, Calendar, CheckCircle, Copy, Globe, Shield, ShieldCheck, Sparkles, Users } from 'lucide-react';

export function ProofPassportSection() {
  const navigate = useNavigate();

  const records = [
    { event: 'AI Workshop 2026', date: '20 Jan 2026', role: 'Participant' },
    { event: 'HackFest 3.0', date: '15 Dec 2025', role: 'Registration Lead' },
    { event: 'Web Dev Bootcamp', date: '10 Nov 2025', role: 'Participant' },
  ];

  return (
    <section id="passport" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#120804]">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.jpg" alt="Elegant verified event" className="w-full h-full object-cover opacity-22 blur-sm scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120804] via-[#1A0B05]/92 to-[#3B1C0B]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(247,197,107,0.28),transparent_28rem)]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid lg:grid-cols-[0.86fr_1.14fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F7C56B]/28 bg-[#F7C56B]/10 mb-6">
              <Shield className="w-3.5 h-3.5 text-[#F7C56B]" />
              <span className="text-xs font-bold text-[#F7C56B] tracking-[0.18em]">PROOF PASSPORT</span>
            </div>
            <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
              A public record that makes participation <span className="text-gradient-gold">feel valuable.</span>
            </h2>
            <p className="text-base text-[#F8EAD2]/68 mb-8 leading-8">
              Participants and volunteers get a shareable achievement passport showing verified events, certificates, roles, skills, and contribution history.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: ShieldCheck, title: 'Verified records', desc: 'Attendance and certificates are tied to real event activity.' },
                { icon: Globe, title: 'Public passport', desc: 'A polished share page for internships, clubs, and portfolios.' },
                { icon: BarChart, title: 'Skills and roles', desc: 'Volunteer work becomes visible proof, not a buried line in a chat.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#F7C56B]/12 border border-[#F7C56B]/18 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#F7C56B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#FFF8E9]">{item.title}</h3>
                    <p className="text-sm text-[#F8EAD2]/52 leading-6">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/login?role=participant')} className="gold-btn flex items-center gap-2">
              <Globe className="w-4 h-4" /> Login & build your passport <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-[#F7C56B]/12 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#F7C56B]/28 bg-gradient-to-br from-[#2C160A]/95 via-[#120804]/96 to-[#050201]/98 p-5 sm:p-7 border-glow">
              <div className="absolute right-6 top-6 opacity-10">
                <Shield className="w-40 h-40 text-[#F7C56B]" />
              </div>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 mb-7">
                <div className="w-20 h-20 rounded-2xl border-2 border-[#F7C56B] bg-[#F7C56B]/15 flex items-center justify-center shadow-xl">
                  <Shield className="w-10 h-10 text-[#F7C56B]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-2xl font-extrabold text-[#FFF8E9]">Your name after login</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/14 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle className="w-3 h-3" /> Cardano ready
                    </span>
                  </div>
                  <p className="text-sm text-[#F7C56B]">OnChainIn Proof Passport</p>
                  <p className="mono-text text-xs text-[#F8EAD2]/38 mt-1">PASS-ID: OCI-••••-2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
                {[
                  { icon: Calendar, value: '4', label: 'Event Records' },
                  { icon: Users, value: '12', label: 'Volunteer Hours' },
                  { icon: Sparkles, value: '6', label: 'Skills Earned' },
                  { icon: Award, value: '3', label: 'Certificates' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-[#F7C56B]/12 bg-[#FFF1CF]/[0.05] p-3 text-center">
                    <stat.icon className="w-5 h-5 text-[#F7C56B] mx-auto mb-2" />
                    <p className="text-2xl font-extrabold text-[#FFF8E9]">{stat.value}</p>
                    <p className="text-[10px] text-[#F8EAD2]/48 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="relative rounded-3xl border border-[#F7C56B]/14 bg-[#080402]/52 p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="section-kicker text-[0.62rem]">Verified Event Records</p>
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.event} className="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[2.5rem_1fr_auto] gap-3 items-center rounded-2xl bg-[#FFF1CF]/[0.045] p-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F7C56B]/12 flex items-center justify-center">
                        <Award className="w-5 h-5 text-[#F7C56B]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#FFF8E9] truncate">{record.event}</p>
                        <p className="text-xs text-[#F8EAD2]/42">{record.date}</p>
                      </div>
                      <span className="col-start-2 sm:col-start-auto justify-self-start sm:justify-self-end rounded-full bg-[#F7C56B]/12 px-3 py-1 text-[11px] font-semibold text-[#F7C56B]">
                        {record.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => navigate('/login')} className="mt-5 w-full rounded-full border border-[#F7C56B]/22 bg-[#F7C56B]/10 px-5 py-3 text-sm font-bold text-[#FFF8E9] hover:bg-[#F7C56B]/16 transition-colors flex items-center justify-center gap-2">
                <Copy className="w-4 h-4 text-[#F7C56B]" /> Login to create your passport
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
