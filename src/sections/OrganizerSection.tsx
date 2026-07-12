import { useNavigate } from 'react-router';
import { ArrowRight, Award, Bell, CheckCircle, Handshake, QrCode, UserCheck, Users, Zap } from 'lucide-react';

export function OrganizerSection() {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, label: 'Live registrations', value: '430', sub: '+38 today' },
    { icon: QrCode, label: 'QR check-ins', value: '276', sub: 'Gate A active' },
    { icon: UserCheck, label: 'Volunteers', value: '58', sub: '12 on duty' },
    { icon: Award, label: 'Certificates', value: '276', sub: 'ready to issue' },
    { icon: Handshake, label: 'Sponsors', value: '14', sub: '5 warm leads' },
    { icon: Zap, label: 'Quick actions', value: '6', sub: 'open now' },
  ];

  return (
    <section id="organizer" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#201006]">
      <div className="absolute inset-0">
        <img src="/images/event-ai-workshop.jpg" alt="Event command setting" className="w-full h-full object-cover opacity-28 blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0402]/96 via-[#1F0D05]/88 to-[#5A2C0D]/58" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080402] via-transparent to-[#0B0503]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid lg:grid-cols-[0.84fr_1.16fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="section-kicker mb-4">Organizer Command Center</p>
            <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
              Software that belongs in the room while the event is <span className="text-gradient-gold">alive.</span>
            </h2>
            <p className="text-base text-[#F8EAD2]/68 mb-8 leading-8">
              From registrations and attendance to volunteers, sponsors, certificates, and quick actions, OnChainIn gives organizers one calm control layer during real event pressure.
            </p>
            <button onClick={() => navigate('/dashboard/organizer')} className="gold-btn flex items-center gap-2">
              Explore Organizer Tools <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -left-8 bottom-4 h-32 w-56 rounded-full bg-[#F7C56B]/16 blur-3xl" />
            <div className="relative rounded-[2rem] border border-[#F7C56B]/18 bg-[#291306]/70 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
              <div className="rounded-t-[1.4rem] border border-[#F7C56B]/14 bg-[#080402] p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C84D38]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E4A53B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#65B66D]" />
                  <span className="ml-3 text-xs text-[#F8EAD2]/40">OnChainIn.app/command/ai-workshop</span>
                </div>
              </div>

              <div className="rounded-b-[1.4rem] border-x border-b border-[#F7C56B]/14 bg-gradient-to-br from-[#130805] to-[#060302] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="section-kicker text-[0.62rem]">Live Command</p>
                    <h3 className="text-2xl font-extrabold text-[#FFF8E9] mt-1">AI Workshop 2026</h3>
                    <p className="text-xs text-[#F8EAD2]/42 mt-1">24 May 2026, Bengaluru</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/14 px-3 py-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle className="w-3 h-3" /> Live
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-[#F7C56B]/10 bg-[#FFF1CF]/[0.045] p-3 hover-lift">
                      <stat.icon className="w-4 h-4 text-[#F7C56B] mb-3" />
                      <p className="text-2xl font-extrabold text-[#FFF8E9]">{stat.value}</p>
                      <p className="text-[11px] font-semibold text-[#F8EAD2]/62">{stat.label}</p>
                      <p className="text-[10px] text-emerald-300/75 mt-1">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-3">
                  <div className="rounded-2xl border border-[#F7C56B]/10 bg-[#FFF1CF]/[0.04] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-[#FFF8E9]">Check-in flow</p>
                      <QrCode className="w-5 h-5 text-[#F7C56B]" />
                    </div>
                    <div className="space-y-3">
                      {['Gate A scanning', 'Certificate queue', 'Volunteer desk'].map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[#F7C56B]/12 text-[#F7C56B] text-xs font-bold flex items-center justify-center">{index + 1}</span>
                          <span className="text-sm text-[#F8EAD2]/62">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#F7C56B]/10 bg-[#FFF1CF]/[0.04] p-4">
                    <p className="text-sm font-bold text-[#FFF8E9] mb-4">Quick actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Check-ins', 'Volunteers', 'Sponsors', 'Certificates'].map((action) => (
                        <button key={action} className="rounded-xl bg-[#F7C56B]/10 px-3 py-2 text-xs font-bold text-[#FFF8E9] hover:bg-[#F7C56B]/18 transition-colors">
                          {action}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-400/10 p-3">
                      <Bell className="w-4 h-4 text-emerald-300 mt-0.5" />
                      <p className="text-xs text-emerald-100/74">Sponsor pitch is ready for review.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto h-3 w-[78%] rounded-b-3xl bg-[#D9A35B]/28" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
