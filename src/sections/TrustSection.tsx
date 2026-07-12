import { Award, Building2, CheckCircle, HeartHandshake, QrCode, Shield, User, UserCog } from 'lucide-react';

export function TrustSection() {
  const roles = [
    { icon: UserCog, title: 'Organizer', desc: 'Create, manage, and control every aspect of events.' },
    { icon: User, title: 'Participant', desc: 'Register, attend, and build a verified passport.' },
    { icon: HeartHandshake, title: 'Volunteer', desc: 'Complete tasks, earn skills, and record hours.' },
    { icon: Building2, title: 'Sponsor', desc: 'Discover events and track partnerships.' },
  ];

  return (
    <section id="trust" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#1A0B05]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#120804] via-[#211007] to-[#080402]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_10%,rgba(247,197,107,0.18),transparent_26rem)]" />

      <div className="section-shell relative z-10">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="section-kicker mb-4">Trust & Ecosystem Layer</p>
            <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
              Built for every role. <span className="text-gradient-gold">Verified</span> for every outcome.
            </h2>
            <p className="text-base text-[#F8EAD2]/64 leading-8">
              OnChainIn connects organizers, participants, volunteers, and sponsors through verifiable records that can be checked after the event ends.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F7C56B]/16 bg-[#FFF1CF]/[0.05] p-5 sm:p-7 backdrop-blur-md border-glow">
            <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-[#F7C56B]" />
                  <h3 className="text-xl font-extrabold text-[#FFF8E9]">Certificate Verification</h3>
                </div>
                <div className="rounded-2xl bg-[#080402]/46 border border-[#F7C56B]/10 p-4">
                  <p className="mono-text text-xs text-[#F8EAD2]/38">Certificate ID</p>
                  <p className="mono-text text-sm sm:text-base text-[#FFF8E9] mt-1 break-all">CERT-AB12CD-EFGH</p>
                  <div className="mt-4 pt-4 border-t border-[#F7C56B]/10 grid gap-2 text-sm text-[#F8EAD2]/58">
                    <span>Issued to: Verified attendee</span>
                    <span>Event: AI Workshop 2026</span>
                    <span>Role: Participant</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/14 px-3 py-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle className="w-3 h-3" /> Valid certificate
                  </div>
                </div>
              </div>
              <div className="mx-auto w-36 h-36 rounded-3xl border border-[#F7C56B]/20 bg-[#FFF8E9] p-4 grid place-items-center shadow-2xl">
                <div className="grid grid-cols-5 gap-1 w-full h-full">
                  {Array.from({ length: 25 }).map((_, index) => (
                    <span key={index} className={`${[0, 1, 2, 4, 5, 7, 10, 12, 13, 16, 18, 20, 21, 23, 24].includes(index) ? 'bg-[#120804]' : 'bg-[#D7A65C]/35'} rounded-[2px]`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {roles.map((role) => (
            <div key={role.title} className="rounded-2xl border border-[#F7C56B]/12 bg-[#FFF1CF]/[0.045] p-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-[#F7C56B]/12 flex items-center justify-center mb-5">
                <role.icon className="w-6 h-6 text-[#F7C56B]" />
              </div>
              <h3 className="text-base font-extrabold text-[#FFF8E9] mb-2">{role.title}</h3>
              <p className="text-sm text-[#F8EAD2]/52 leading-6">{role.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-[#F8EAD2]/48">
          <Award className="w-4 h-4 text-[#F7C56B]" />
          <span>Every certificate can be scanned, verified, and tied back to a real OnChainIn record.</span>
          <QrCode className="w-4 h-4 text-[#F7C56B] hidden sm:block" />
        </div>
      </div>
    </section>
  );
}
