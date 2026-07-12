import { Link } from 'react-router';
import { Mail, Github, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

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
              Event operations powered by Cardano. Lace check-in, on-chain attendance, certificates with tx hashes.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Product</h4>
            <div className="space-y-2.5">
              <Link to="/events" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Events</Link>
              <Link to="/events" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Proof Passport</Link>
              <Link to="/verify/certificate/CERT-AB12CD-EFGH" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Verify Certificate</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Dashboards</h4>
            <div className="space-y-2.5">
              <Link to="/dashboard/organizer" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Organizer</Link>
              <Link to="/dashboard/participant" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Participant</Link>
              <Link to="/dashboard/volunteer" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Volunteer</Link>
              <Link to="/dashboard/sponsor" className="block text-sm text-[#D9CFBC] hover:text-[#F7C56B] transition-colors">Sponsor</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#FFF8E9] mb-4">Contact</h4>
            <div className="space-y-2.5">
              <span className="flex items-center gap-2 text-sm text-[#D9CFBC]"><Mail className="w-4 h-4 text-[#F7C56B]" /> hello@OnChainIn.com</span>
              <div className="flex gap-3 mt-3">
                <Github className="w-4 h-4 text-[#D9CFBC] hover:text-[#F7C56B] cursor-pointer transition-colors" />
                <Twitter className="w-4 h-4 text-[#D9CFBC] hover:text-[#F7C56B] cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[#F7C56B]/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#B9AE9B]">OnChainIn · Built on Cardano</p>
          <p className="text-xs text-[#B9AE9B]">Event attendance, verified on-chain</p>
        </div>
      </div>
    </footer>
  );
}
