import { Award, BarChart3, Calendar, CheckCircle, FileBadge, Handshake, Kanban, QrCode, Shield, UserPlus } from 'lucide-react';

export function WorkflowSection() {
  const steps = [
    { icon: Calendar, num: '01', title: 'Create Event', desc: 'Organizer adds event details, roles, sponsors, and budget.' },
    { icon: UserPlus, num: '02', title: 'Register', desc: 'Participants register and receive unique QR tickets.' },
    { icon: QrCode, num: '03', title: 'QR Attendance', desc: 'Organizer verifies attendance through QR scanning.' },
    { icon: Award, num: '04', title: 'Certificate', desc: 'System generates verified digital certificates.' },
    { icon: Shield, num: '05', title: 'Proof Passport', desc: 'Participants receive a public proof record.' },
  ];

  const features = [
    { icon: QrCode, title: 'QR Registration & Ticketing', desc: 'Smart registrations and unique QR tickets.' },
    { icon: CheckCircle, title: 'Attendance Verification', desc: 'Scan and verify attendance in real time.' },
    { icon: Kanban, title: 'Volunteer Kanban', desc: 'Assign tasks, owners, and deadlines.' },
    { icon: Handshake, title: 'Sponsor Matching', desc: 'Match sponsors by audience and category.' },
    { icon: BarChart3, title: 'Budget Analytics', desc: 'Track income, expenses, and health.' },
    { icon: FileBadge, title: 'Automated Digital Certificates', desc: 'Issue certificates after validated activity.' },
  ];

  return (
    <section id="workflow" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#0B0503] venue-texture">
      <div className="absolute inset-0 bg-gradient-to-b from-[#100704] via-[#2A150A] to-[#090403]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(247,197,107,0.2),transparent_32rem)]" />

      <div className="section-shell relative z-10">
        <div className="max-w-4xl mb-12">
          <p className="section-kicker mb-4">Workflow + Core Features</p>
          <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
            One connected journey from planning to <span className="text-gradient-gold">verified proof.</span>
          </h2>
          <p className="text-base text-[#F8EAD2]/66 leading-8 max-w-2xl">
            OnChainIn simplifies the event lifecycle and turns every operational step into trusted, visible progress.
          </p>
        </div>

        <div className="relative rounded-[2rem] border border-[#F7C56B]/15 bg-[#160905]/56 p-4 sm:p-6 lg:p-8 backdrop-blur-md shadow-2xl">
          <div className="absolute left-12 right-12 top-[5.25rem] dotted-arrow hidden lg:block" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={step.num} className={`relative glass-card hover-lift rounded-3xl p-5 ${index % 2 ? 'lg:mt-12' : ''}`}>
                <div className="flex items-center justify-between mb-8">
                  <span className="mono-text text-xs text-[#F8EAD2]/38">{step.num}</span>
                  <div className="w-12 h-12 rounded-2xl bg-[#F7C56B]/12 border border-[#F7C56B]/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[#F7C56B]" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#FFF8E9] mb-2">{step.title}</h3>
                <p className="text-sm text-[#F8EAD2]/54 leading-6">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="features" className="scroll-mt-24 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="section-kicker mb-3">Core Feature Layer</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FFF8E9]">
                The operating system beneath the journey.
              </h3>
            </div>
            <p className="text-sm text-[#F8EAD2]/52 max-w-md">
              Compact tools that support the main event flow without turning the page into another dashboard wall.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-[#F7C56B]/12 bg-[#FFF1CF]/[0.045] p-4 hover-lift hover:border-[#F7C56B]/32">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F7C56B]/12 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#F7C56B]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FFF8E9]">{feature.title}</h4>
                    <p className="text-xs text-[#F8EAD2]/48 leading-5 mt-1">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
