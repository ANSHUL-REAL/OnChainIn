import { FileSpreadsheet, FileX, MessageCircle, Table2 } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: FileSpreadsheet,
      title: 'Google Forms',
      description: 'Registrations get lost and are hard to track. No built-in attendance or follow-up.',
      className: 'lg:rotate-[-4deg] lg:translate-y-8',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Groups',
      description: 'Communication becomes noisy and unstructured. Important updates get buried.',
      className: 'lg:rotate-[3deg]',
    },
    {
      icon: Table2,
      title: 'Spreadsheets',
      description: 'Volunteer tasks, budgets, and attendance become messy and error-prone.',
      className: 'lg:rotate-[-2deg] lg:translate-y-14',
    },
    {
      icon: FileX,
      title: 'Manual Certificates',
      description: 'Certificates take hours to create and are difficult for others to verify.',
      className: 'lg:rotate-[4deg] lg:translate-y-3',
    },
  ];

  return (
    <section id="problem" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#1C0E07] venue-texture">
      <div className="absolute inset-0">
        <img src="/images/event-hackfest.jpg" alt="Busy event operations" className="w-full h-full object-cover opacity-[0.18] blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080402] via-[#2A1409]/88 to-[#100704]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(247,197,107,0.18),transparent_28rem)]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-center">
          <div className="reveal-up">
            <p className="section-kicker mb-4">The Problem</p>
            <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
              Event operations are still <span className="text-gradient-gold">scattered.</span>
            </h2>
            <p className="text-base text-[#F8EAD2]/68 leading-8">
              Most events are stitched together through forms, WhatsApp groups, spreadsheets, manual attendance, and unverified certificates. The result feels busy before the venue even opens.
            </p>
            <div className="mt-8 rounded-2xl border border-[#F7C56B]/18 bg-[#120703]/52 p-5 backdrop-blur-md">
              <p className="text-lg text-[#FFF8E9]">
                <span className="text-[#F7C56B] font-bold">OnChainIn</span> brings every moving part into one verified workflow.
              </p>
            </div>
          </div>

          <div className="relative min-h-[520px] sm:min-h-[430px]">
            <div className="absolute left-4 right-4 top-1/2 dotted-arrow hidden lg:block" />
            {problems.map((p, index) => (
              <div
                key={p.title}
                className={`glass-card hover-lift absolute w-[78%] sm:w-[46%] rounded-2xl p-5 shadow-2xl ${p.className}
                  ${index === 0 ? 'left-0 top-4' : ''}
                  ${index === 1 ? 'right-0 top-20' : ''}
                  ${index === 2 ? 'left-6 bottom-8' : ''}
                  ${index === 3 ? 'right-3 bottom-2' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7C56B]/12 border border-[#F7C56B]/18 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-6 h-6 text-[#F7C56B]" />
                  </div>
                  <div>
                    <p className="text-[10px] mono-text text-[#F8EAD2]/36 mb-1">0{index + 1} / scattered ops</p>
                    <h3 className="text-lg font-bold text-[#FFF8E9] mb-2">{p.title}</h3>
                    <p className="text-sm text-[#F8EAD2]/56 leading-6">{p.description}</p>
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
