import { Award, Bot, CheckCircle2, ClipboardList, QrCode, ShieldCheck } from 'lucide-react';

const screenModules = [
  { icon: Bot, label: 'AI draft' },
  { icon: ClipboardList, label: 'Applications' },
  { icon: QrCode, label: 'QR check-in' },
  { icon: Award, label: 'Certificates' },
];

export function ProjectLaptopShowcase() {
  return (
    <div className="eventos-project-laptop" data-scroll-reveal="project-laptop" aria-label="OnChainIn organizer dashboard shown inside a laptop mockup">
      <div className="eventos-project-laptop-glow" />
      <div className="eventos-project-laptop-scene">
        <div className="eventos-project-laptop-screen">
          <div className="eventos-project-laptop-bezel">
            <div className="eventos-project-camera" />
            <div className="eventos-project-screen-ui">
              <div className="eventos-project-screen-nav">
                <div className="flex items-center gap-2">
                  <span className="eventos-mini-logo">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <img src="/logo.png" alt="OnChainIn" className="h-5 w-5 object-contain" />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#6B705F]">
                  <span>Events</span>
                  <span>Dashboard</span>
                </div>
              </div>

              <div className="eventos-project-screen-hero">
                <div>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#71821E]">Cardano event ops</p>
                  <h3 className="mt-2 text-2xl font-black leading-none text-[#10120B]">
                    Create, approve, verify.
                  </h3>
                  <p className="mt-3 max-w-md text-xs leading-5 text-[#5D6253]">
                    Build events, collect applications, check in with QR or Cardano, and issue on-chain verified proof.
                  </p>
                </div>
                <div className="eventos-project-proof-card">
                  <ShieldCheck className="h-5 w-5 text-[#52670F]" />
                  <span>Cardano proof ready</span>
                </div>
              </div>

              <div className="eventos-project-screen-grid">
                <div className="eventos-project-chat-card">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#52670F]" />
                    <span className="text-xs font-black tracking-[0.16em] text-[#52670F]">PROMPT TO EVENT</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#34382C]">
                    “Create a workshop with approvals, volunteers, QR check-in, sponsors, and certificates.”
                  </p>
                </div>

                <div className="eventos-project-status-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-[0.16em] text-[#52670F]">LIVE FLOW</span>
                    <span className="rounded-full bg-[#EAF4D0] px-2 py-1 text-[0.65rem] font-black text-[#52670F]">Active</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {['Registration form generated', 'Approval queue enabled', 'QR ticket after approval'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs font-bold text-[#444A39]">
                        <CheckCircle2 className="h-4 w-4 text-[#52670F]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="eventos-project-module-strip">
                {screenModules.map(item => (
                  <div key={item.label} className="eventos-project-module">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="eventos-project-hinge" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="eventos-project-laptop-base">
          <div className="eventos-project-keyboard">
            {Array.from({ length: 48 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="eventos-project-trackpad" />
          <div className="eventos-project-front-lip" />
        </div>
      </div>
    </div>
  );
}
