import { BadgeDollarSign, Handshake, Mail, PieChart, Sparkles, TrendingUp, Wallet } from 'lucide-react';

export function GrowthSection() {
  const packages = [
    { name: 'Title Partner', value: '50,000', match: '92% fit' },
    { name: 'Workshop Sponsor', value: '25,000', match: '87% fit' },
    { name: 'Community Booth', value: '15,000', match: '81% fit' },
  ];

  const finance = [
    { label: 'Income', value: '90,000', icon: TrendingUp, color: 'text-emerald-300' },
    { label: 'Expenses', value: '105,000', icon: Wallet, color: 'text-rose-300' },
    { label: 'Balance', value: '-15,000', icon: BadgeDollarSign, color: 'text-[#FFF8E9]' },
  ];

  return (
    <section id="growth" className="relative scroll-mt-20 py-20 sm:py-24 overflow-hidden bg-[#100704] venue-texture">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0503] via-[#241108] to-[#120804]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(247,197,107,0.18),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(155,78,27,0.28),transparent_28rem)]" />

      <div className="section-shell relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <p className="section-kicker mb-4">Growth & Finance Layer</p>
          <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF8E9] mb-5">
            Grow the event and protect the <span className="text-gradient-gold">budget story.</span>
          </h2>
          <p className="text-base text-[#F8EAD2]/62 leading-8">
            Sponsors, matching, pitch generation, income, expenses, balance, and budget health live together as one business layer.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-[2rem] border border-[#F7C56B]/16 bg-[#FFF1CF]/[0.05] p-5 sm:p-7 backdrop-blur-md hover-lift">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="section-kicker text-[0.62rem]">Sponsor Growth</p>
                <h3 className="text-2xl font-extrabold text-[#FFF8E9] mt-1">Packages and matching</h3>
              </div>
              <Handshake className="w-7 h-7 text-[#F7C56B]" />
            </div>

            <div className="space-y-3 mb-6">
              {packages.map((item) => (
                <div key={item.name} className="rounded-2xl border border-[#F7C56B]/10 bg-[#080402]/36 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#FFF8E9]">{item.name}</p>
                      <p className="text-xs text-[#F8EAD2]/46 mt-1">Recommended partner package</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-[#F7C56B]">Rs {item.value}</p>
                      <p className="text-xs text-emerald-300">{item.match}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#F7C56B]/14 bg-[#F7C56B]/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#F7C56B] mt-1" />
                <div>
                  <p className="text-sm font-bold text-[#FFF8E9]">AI sponsor pitch</p>
                  <p className="text-sm text-[#F8EAD2]/58 leading-6 mt-1">Generate a tailored pitch with audience, package value, and proof of prior event reach.</p>
                </div>
                <Mail className="w-5 h-5 text-[#F7C56B] ml-auto flex-shrink-0" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#F7C56B]/16 bg-gradient-to-br from-[#2A1409]/82 to-[#090403]/88 p-5 sm:p-7 backdrop-blur-md hover-lift">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="section-kicker text-[0.62rem]">Budget Health</p>
                <h3 className="text-2xl font-extrabold text-[#FFF8E9] mt-1">Finance overview</h3>
              </div>
              <span className="rounded-full bg-amber-300/14 px-3 py-1.5 text-xs font-bold text-amber-200">Needs sponsor lift</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {finance.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#F7C56B]/10 bg-[#FFF1CF]/[0.045] p-4">
                  <item.icon className={`w-5 h-5 ${item.color} mb-4`} />
                  <p className={`text-2xl font-extrabold ${item.color}`}>Rs {item.value}</p>
                  <p className="text-xs text-[#F8EAD2]/48 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[#F7C56B]/10 bg-[#080402]/42 p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold text-[#FFF8E9]">Budget Health</p>
                <PieChart className="w-5 h-5 text-[#F7C56B]" />
              </div>
              <div className="h-4 rounded-full bg-[#FFF1CF]/10 overflow-hidden mb-4">
                <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-emerald-400 via-[#F7C56B] to-rose-400" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {['Ticket sales', 'Sponsor gap', 'Ops spend'].map((label, index) => (
                  <div key={label} className="rounded-2xl bg-[#FFF1CF]/[0.04] p-3">
                    <p className="text-lg font-extrabold text-[#FFF8E9]">{[42, 18, 40][index]}%</p>
                    <p className="text-[10px] text-[#F8EAD2]/46">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
