import { Link } from 'react-router'
import { Mail, Github } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export function Footer() {
  return (
    <footer className="bg-[#10120B] border-t border-[#DCE8BE]/10 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandLogo variant="icon" size={28} linkToHome />
              <span className="rounded-full border border-[#00E0FF]/40 bg-[#52670F]/50 px-2 py-0.5 text-[10px] font-bold text-[#00E0FF]">
                Cardano
              </span>
            </div>
            <p className="text-sm text-[#D9CFBC] leading-relaxed max-w-xs">
              Event operations powered by Cardano. Multi-wallet check-in (Lace, Eternl, Nami…),
              on-chain attendance, certificates with tx hashes.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Product</h4>
            <div className="space-y-2.5">
              <Link to="/events" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">
                Events
              </Link>
              <Link to="/events" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">
                Proof Passport
              </Link>
              <Link
                to="/verify/certificate/CERT-AB12CD-EFGH"
                className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
              >
                Verify Certificate
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Dashboards</h4>
            <div className="space-y-2.5">
              <Link
                to="/dashboard/organizer"
                className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
              >
                Organizer
              </Link>
              <Link
                to="/dashboard/participant"
                className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
              >
                Participant
              </Link>
              <Link
                to="/dashboard/volunteer"
                className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
              >
                Volunteer
              </Link>
              <Link
                to="/dashboard/sponsor"
                className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
              >
                Sponsor
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Team & contact</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[#FFF8E9]">Anshul Nautiyal</p>
                <a
                  href="mailto:anshulnautiyal0512@gmail.com"
                  className="flex items-center gap-2 text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#F7C56B]" /> anshulnautiyal0512@gmail.com
                </a>
                <a
                  href="https://github.com/ANSHUL-REAL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
                >
                  <Github className="w-4 h-4 text-[#F7C56B]" /> github.com/ANSHUL-REAL
                </a>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[#FFF8E9]">Sourab Reddy</p>
                <a
                  href="mailto:sourabreddimalla@gmail.com"
                  className="flex items-center gap-2 text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#F7C56B]" /> sourabreddimalla@gmail.com
                </a>
                <a
                  href="https://github.com/SOURABREDDY394"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors"
                >
                  <Github className="w-4 h-4 text-[#F7C56B]" /> github.com/SOURABREDDY394
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[#F7C56B]/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-xs text-[#B9AE9B]">OnChainIn · Built on Cardano</p>
          <p className="text-sm font-semibold text-[#F7C56B]">
            Made with love ❤️ by team RAGNAROK
          </p>
          <p className="text-xs text-[#B9AE9B]">Event attendance, verified on-chain</p>
        </div>
      </div>
    </footer>
  )
}
