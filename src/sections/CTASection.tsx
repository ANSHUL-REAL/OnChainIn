import { useNavigate } from 'react-router';
import { ArrowRight, Play } from 'lucide-react';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 sm:py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.jpg" alt="Cinematic event venue" className="w-full h-full object-cover opacity-64" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080402]/96 via-[#120804]/70 to-[#080402]/88" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080402] via-transparent to-[#080402]" />
      </div>
      <div className="section-shell relative z-10 text-center">
        <p className="section-kicker mb-5">Ready For The Next Event</p>
        <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-7xl text-[#FFF8E9] mb-7 max-w-5xl mx-auto">
          Turn your next event into <span className="text-gradient-gold">verified proof of participation.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#F8EAD2]/68 mb-10 max-w-2xl mx-auto leading-8">
          Create, manage, verify, and elevate every event with one elegant platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => navigate('/signup')} className="gold-btn flex items-center gap-2 text-base px-8 py-3">
            Sign Up <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/login')} className="ghost-btn flex items-center gap-2 rounded-full text-base px-8 py-3">
            Sign In
          </button>
          <button onClick={() => navigate('/events')} className="ghost-btn flex items-center gap-2 rounded-full text-base px-8 py-3">
            <Play className="w-4 h-4" /> Browse Events
          </button>
        </div>
      </div>
    </section>
  );
}
