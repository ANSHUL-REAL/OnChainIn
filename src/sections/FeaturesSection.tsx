import { QrCode, CheckCircle, Kanban, Handshake, BarChart3, FileBadge } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    { icon: QrCode, title: 'QR Registration & Ticketing', desc: 'Participants register easily and receive unique QR tickets for seamless event flow.', },
    { icon: CheckCircle, title: 'Attendance Verification', desc: 'Scan QR codes and verify attendance in real-time with accuracy and speed.', },
    { icon: Kanban, title: 'Volunteer Kanban', desc: 'Assign tasks, set deadlines, and track volunteer progress with an easy Kanban board.', },
    { icon: Handshake, title: 'Sponsor Matching', desc: 'Find and connect with the right sponsors based on category, audience, reach, and budget.', },
    { icon: BarChart3, title: 'Budget Analytics', desc: 'Track income, expenses, balance, and budget health with smart analytics and reports.', },
    { icon: FileBadge, title: 'Automated Digital Certificates', desc: 'Generate verified digital certificates automatically after validated attendance and roles.', },
  ];

  return (
    <section id="features" className="py-24 bg-[#030303]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-[#E49B3A] uppercase tracking-widest mb-3">Core Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything organizers need<br />in <span className="text-gradient-gold">one platform.</span>
          </h2>
          <p className="text-base text-white/50 max-w-2xl mx-auto">
            Integrated tools for registrations, volunteers, sponsors, budgets, attendance, certificates, and verified proof records.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 group hover:border-[#E49B3A]/30 transition-all">
              <div className="w-14 h-14 rounded-lg bg-[#E49B3A]/10 border border-[#E49B3A]/20 flex items-center justify-center mb-4 group-hover:bg-[#E49B3A]/20 transition-colors">
                <f.icon className="w-7 h-7 text-[#E49B3A]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
