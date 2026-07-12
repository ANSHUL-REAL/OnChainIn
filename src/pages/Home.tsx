import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowRight, ArrowRightCircle, Award, Blocks, Bot, CalendarDays, ClipboardCheck, FileText, Fingerprint, LockKeyhole, Menu, QrCode, ShieldCheck, Sparkles, Ticket, Users, Wallet, X, Zap } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ProjectLaptopShowcase } from '@/components/ProjectLaptopShowcase';
import { BrandLogo } from '@/components/BrandLogo';
import { CardanoTagRow } from '@/components/CardanoTags';
import store from '@/data/store';
import { useAuth } from '@/hooks/useAuth';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const defaultPrompt = 'Create a 100-seat AI workshop in Hyderabad with registration approval, volunteers, Cardano check-in, and certificates';
const AI_PROMPT_KEY = 'OnChainIn_ai_prompt';

const featurePills = [
  'AI creates events for you',
  'Approve applications',
  'Cardano wallet check-in',
  'Tx hash on certificates',
  'QR + on-chain proof',
];

const moduleStrip = [
  'Cardano Check-in',
  'Lace / CIP-30',
  'AI Create Event',
  'Registration Form',
  'Applications',
  'QR Check-in',
  'On-chain Certificates',
  'Proof Passport',
  'Volunteers',
  'Sponsors',
];

const heroNavLinks = ['AI Builder', 'Events', 'Proof', 'Sponsors', 'Help'];

const smoothEase = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: smoothEase },
  }),
};

export default function Home() {
  const navigate = useNavigate();
  const { user, continueAs } = useAuth();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScrollReveal();
  const events = store.getEvents();
  const registrations = store.getRegistrations();
  const certificates = store.getCertificates();
  const proofRecords = store.getPassportRecords();
  const volunteerTasks = store.getVolunteerTasks();
  const sponsorInterests = store.getSponsorInterests();

  const liveData = [
    { label: 'EVENTS', value: events.length, tone: 'bg-[#EDF7EC] text-[#53710C]' },
    { label: 'APPLICATIONS', value: registrations.length, tone: 'bg-[#F7F7D9] text-[#5D6710]' },
    { label: 'PROOF RECORDS', value: proofRecords.length, tone: 'bg-[#EAF1FF] text-[#315B92]' },
    { label: 'CERTIFICATES', value: certificates.length, tone: 'bg-[#FFF4DE] text-[#A06D11]' },
    { label: 'VOLUNTEER TASKS', value: volunteerTasks.length, tone: 'bg-[#F4EEFF] text-[#7053A6]' },
    { label: 'SPONSOR LEADS', value: sponsorInterests.length, tone: 'bg-[#FFEDEC] text-[#A84939]' },
  ];

  const productCards = [
    {
      icon: Bot,
      title: '1. Create with AI',
      text: 'Type a prompt. AI builds the event draft — title, form, volunteers, sponsors, and certificate setup. Edit and publish.',
      stats: ['One prompt', 'Editable draft', 'Publish'],
    },
    {
      icon: Ticket,
      title: '2. People apply',
      text: 'Participants browse events, apply, and wait for approval. Tickets appear only after you approve them.',
      stats: ['Browse', 'Apply', 'Approve'],
    },
    {
      icon: Wallet,
      title: '3. Check in on Cardano',
      text: 'On event day, attendees connect a Cardano wallet and sign a transaction. That is real on-chain attendance proof.',
      stats: ['Event day only', 'Wallet sign', 'Tx hash'],
    },
    {
      icon: ShieldCheck,
      title: '4. Certificates + proof',
      text: 'Issue certificates that can show the Cardano tx hash. Anyone can verify on the certificate page or explorer.',
      stats: ['Issue cert', 'Tx on cert', 'Public verify'],
    },
  ];

  const startCreating = () => {
    localStorage.setItem(AI_PROMPT_KEY, prompt.trim() || defaultPrompt);
    if (!user) {
      navigate('/login?role=organizer');
      return;
    }
    if (user.role !== 'organizer') {
      const switched = continueAs('organizer');
      if (!switched) {
        navigate('/login?role=organizer');
        return;
      }
    }
    navigate('/dashboard/organizer/create-with-ai');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F2EB] text-[#192837]">
      <main>
        <section className="relative min-h-screen w-full overflow-hidden font-[var(--font-body)] text-[#192837]">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,242,235,0.94)_0%,rgba(246,242,235,0.72)_42%,rgba(246,242,235,0.2)_100%)]" />

          <nav className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
            <BrandLogo
              variant="full"
              size={34}
              textClassName="text-sm font-bold tracking-[0.14em] text-[#192837]"
            />

            <div className="hidden items-center gap-8 md:flex">
              {heroNavLinks.map((item) => (
                <Link
                  key={item}
                  to={
                    item === 'Events'
                      ? '/events'
                      : item === 'AI Builder'
                        ? '/signup?role=organizer'
                        : item === 'Proof'
                          ? '/signup?role=participant'
                          : '/events'
                  }
                  className="text-sm font-medium text-[#192837]/80 transition-opacity hover:opacity-100"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/signup"
                className="rounded-full bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#192837] shadow-sm transition hover:bg-[#F2F2EE]"
              >
                Sign In
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(true)} className="inline-flex rounded-full bg-[#F2F2EE] p-3 text-[#192837] md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </nav>

          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.button
                  aria-label="Close menu backdrop"
                  className="fixed inset-0 z-[80] bg-[rgba(25,40,55,0.35)] backdrop-blur-[4px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.aside
                  className="fixed right-0 top-0 z-[90] h-[100dvh] w-[min(88vw,360px)] bg-[#CFC8C5] shadow-[-12px_0_48px_rgba(25,40,55,0.18)]"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
                >
                  <div className="flex items-center justify-between px-6 py-5">
                    <BrandLogo variant="full" size={32} linkToHome={false} textClassName="text-sm font-bold tracking-[0.12em] text-[#192837]" />
                    <button onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-[#F2F2EE] p-3 text-[#192837]" aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="h-px bg-[#192837]/15" />
                  <div className="grid gap-2 px-6 py-7">
                    {heroNavLinks.map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18 + index * 0.07, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          to={item === 'Events' ? '/events' : item === 'AI Builder' ? '/login?role=organizer' : item === 'Proof' ? '/login?role=participant' : '/'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-2xl px-2 py-3 text-2xl font-black text-[#192837]"
                        >
                          {item}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 grid gap-3 p-6">
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-center text-sm font-semibold text-white"
                    >
                      Sign Up
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full bg-[var(--color-login-bg)] px-5 py-3 text-center text-sm font-semibold text-[#192837]"
                    >
                      Sign In
                    </Link>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8" style={{ paddingTop: 'clamp(40px, 8vw, 72px)' }}>
            <div className="max-w-[560px]">
              <motion.h1
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mb-6 font-[var(--font-heading)] text-[clamp(1.75rem,5vw,3.1rem)] leading-[1.08] tracking-[-0.02em] text-[#192837]"
              >
                <Zap
                  className="relative -top-0.5 mr-1.5 inline h-[1.05em] w-[1.05em] align-middle text-[#192837]"
                  aria-hidden
                />
                Create Events from a Prompt{' '}
                <LockKeyhole
                  className="relative -top-0.5 mx-1 inline h-[0.95em] w-[0.95em] align-middle text-[#192837]"
                  aria-hidden
                />{' '}
                with Verified Proof
                <Fingerprint
                  className="relative -top-0.5 ml-1.5 inline h-[1.05em] w-[1.05em] align-middle text-[#192837]"
                  aria-hidden
                />
              </motion.h1>

              <motion.p
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="max-w-[520px] text-[clamp(0.95rem,2.2vw,1.1rem)] leading-[1.65] text-[#192837]/75"
              >
                OnChainIn helps organizers create event drafts with AI, collect applications, approve
                attendees, check in with Cardano wallets, and publish certificates with on-chain proof.
              </motion.p>

              <motion.div
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <Link
                  to="/signup?role=organizer"
                  className="flex min-w-[200px] items-center justify-between gap-6 rounded-full bg-[#7C3AED] px-6 py-[17px] text-base font-semibold text-white shadow-[0_8px_28px_rgba(124,58,237,0.3)] transition hover:bg-[#6D28D9]"
                >
                  Start Creating
                  <ArrowRightCircle className="h-5 w-5" />
                </Link>
                <Link
                  to="/events"
                  className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-white px-6 py-[17px] text-sm font-semibold text-[#192837] shadow-sm transition hover:bg-[#F2F2EE]"
                >
                  Browse Events
                </Link>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
                <CardanoTagRow />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="hidden max-w-[88rem] mx-auto px-4 sm:px-6 pb-10 text-center">
          <div className="flex justify-center mb-7" data-scroll-reveal="zoom">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-[#DCE8BE] bg-white/80 px-4 py-2 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#EEF5D9] text-[#5C7415] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="min-w-0 text-center text-sm font-semibold leading-5 text-[#40510C]">
                <span className="sm:hidden">Create events from a prompt</span>
                <span className="hidden sm:inline">Create and manage events from a prompt</span>
              </span>
            </div>
          </div>

          <h1 className="mx-auto max-w-5xl text-3xl sm:text-6xl lg:text-7xl leading-[0.98] sm:leading-[0.94] font-black tracking-0 px-1" data-scroll-reveal="clip">
            <span className="block sm:hidden">CREATE</span>
            <span className="block sm:hidden">EVENTS</span>
            <span className="block sm:hidden">FROM A</span>
            <span className="block sm:hidden">PROMPT</span>
            <span className="hidden sm:block">CREATE EVENTS FROM A PROMPT</span>
            <span className="block text-[#5C7415]">...AND TURN</span>
            <span className="block sm:hidden text-[#5C7415]">APPROVALS</span>
            <span className="block sm:hidden text-[#5C7415]">INTO</span>
            <span className="block sm:hidden text-[#5C7415]">VERIFIED</span>
            <span className="block sm:hidden text-[#5C7415]">PROOF</span>
            <span className="hidden sm:block text-[#5C7415]">APPROVALS INTO</span>
            <span className="hidden sm:block text-[#5C7415]">VERIFIED PROOF</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[22rem] sm:max-w-4xl px-2 text-base sm:text-lg leading-8 text-[#5E6256] italic" data-scroll-reveal="hinge">
            “OnChainIn runs full event operations — and turns attendance into Cardano transactions anyone can verify on an explorer.”
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 motion-perspective" data-scroll-reveal="lift">
            {[
              { icon: CalendarDays, label: 'Event draft' },
              { icon: FileText, label: 'Registration form' },
              { icon: QrCode, label: 'QR check-in' },
              { icon: Award, label: 'Certificates' },
            ].map(item => (
              <div key={item.label} className="motion-depth-card flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm border border-[#E7E1D2]">
                <item.icon className="w-4 h-4 text-[#5C7415]" />
                <span className="text-sm font-semibold text-[#424638]">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="relative mx-auto mt-10 max-w-6xl" data-scroll-reveal="tilt">
            <div className="absolute inset-0 translate-y-4 rounded-[2.2rem] bg-[#DCE8BE] blur-2xl opacity-55" />
            <div className="goavo-prompt-glow relative flex items-center gap-4 rounded-[2rem] bg-white p-4 sm:p-5 shadow-[0_22px_55px_rgba(61,72,25,0.14)] border border-[#E7E1D2] overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF5D9] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#5C7415]" />
              </div>
              <input
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') startCreating();
                }}
                className="flex-1 min-w-0 bg-transparent text-left text-sm sm:text-base text-[#5E6256] placeholder:text-[#9AA08D] focus:outline-none"
                placeholder="Describe your event..."
                aria-label="Describe your event"
              />
              <button
                onClick={startCreating}
                className="w-14 h-14 rounded-full bg-[#52670F] text-white flex items-center justify-center hover:bg-[#40510C] transition-colors flex-shrink-0"
                aria-label="Sign up for OnChainIn"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3" data-scroll-reveal="stack">
            {featurePills.map(item => (
              <span key={item} className="rounded-full border border-[#BBDBC5] bg-[#F1FFF5] px-4 py-2 text-sm font-medium text-[#147142]">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="max-w-[88rem] mx-auto px-4 sm:px-6 py-8" data-scroll-reveal="hinge">
          <div className="flex justify-center mb-5" data-scroll-reveal="clip">
            <span className="rounded-full border border-[#E7E1D2] bg-[#F1F0E2] px-7 py-3 text-xs font-bold tracking-[0.22em] text-[#5E6256]">
              REALTIME OnChainIn DATA
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveData.map((item, index) => (
              <div key={item.label} className={`motion-depth-card rounded-2xl border border-black/10 p-8 text-center min-h-32 shadow-sm ${item.tone}`} data-scroll-reveal={index % 2 === 0 ? 'stack' : 'stack-right'}>
                <p className="text-xs font-black tracking-[0.18em]">{item.label}</p>
                <p className="mt-4 text-4xl font-black tracking-wide">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 overflow-hidden" data-scroll-reveal="skew">
          <p className="text-center text-xs font-black tracking-[0.22em] text-[#52670F] mb-5">CARDANO + EVENT OPS MODULES</p>
          <div className="relative flex gap-5 whitespace-nowrap">
            <div className="flex min-w-full animate-marquee gap-5">
              {[...moduleStrip, ...moduleStrip].map((item, index) => (
                <span key={`${item}-${index}`} className="min-w-44 rounded-xl bg-white border border-[#E7E1D2] px-5 py-4 text-center text-sm font-bold text-[#6A7D1A] shadow-sm">
                  {item}
                </span>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F9F8F1] to-transparent" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F9F8F1] to-transparent" />
          </div>
        </section>

        <section className="max-w-[88rem] mx-auto px-4 sm:px-6 py-12" data-scroll-reveal="lift">
          <div className="text-center mb-8" data-scroll-reveal="clip">
            <p className="text-sm font-bold text-[#52670F]">HOW IT WORKS</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-black tracking-0">Simple for everyone</h2>
            <p className="mt-3 max-w-2xl mx-auto text-[#5E6256]">
              AI makes creating events easy. Cardano makes attendance honest. Same product — two clear features.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-5">
            {productCards.map((card, index) => (
              <article
                key={card.title}
                className="goavo-card-effect rounded-3xl border border-[#E7E1D2] bg-white p-6 shadow-sm"
                data-scroll-reveal={['tilt', 'hinge', 'tilt-right', 'zoom'][index]}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5D9]">
                  <card.icon className="h-6 w-6 text-[#5C7415]" />
                </div>
                <h3 className="text-xl font-black text-[#14150F]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5E6256]">{card.text}</p>
                <div className="mt-6 grid grid-cols-1 gap-2">
                  {card.stats.map((stat) => (
                    <div key={stat} className="rounded-xl bg-[#F7F6EB] px-3 py-3">
                      <p className="text-xs font-black tracking-wide text-[#52670F]">{stat.toUpperCase()}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-[88rem] mx-auto px-4 sm:px-6 py-12" data-scroll-reveal="zoom">
          <div className="rounded-[2rem] bg-[#10120B] text-white p-6 sm:p-10 overflow-hidden relative motion-perspective">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#D7F06A]/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-center">
              <div data-scroll-reveal="left">
                <p className="text-sm font-bold text-[#D8F066]">HOW EVENT ORGANIZERS USE IT</p>
                <h2 className="mt-3 text-4xl sm:text-5xl font-black leading-tight">Chat creates the event. Dashboards run the room.</h2>
                <p className="mt-5 text-white/62 leading-7">
                  OnChainIn is an event operations platform with Cardano-verified attendance — create events, manage registrations, run QR/on-chain check-ins,
                  coordinate volunteers and sponsors, and issue certificates with permanent proof.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/signup" className="rounded-full bg-[#D8F066] px-6 py-3 text-sm font-black text-[#10120B]">Sign Up</Link>
                  <Link to="/login" className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white">Sign In</Link>
                </div>
              </div>

              <ProjectLaptopShowcase />
            </div>
          </div>
        </section>

        <section className="max-w-[88rem] mx-auto px-4 sm:px-6 pt-8 pb-16 text-center" data-scroll-reveal="zoom">
          <Users className="w-10 h-10 mx-auto text-[#5C7415] mb-4" />
          <h2 className="text-4xl sm:text-6xl font-black tracking-0">Build your next event from one prompt.</h2>
          <div className="mt-7 flex justify-center gap-3 flex-wrap">
            <Link to="/signup" className="rounded-full bg-[#52670F] px-7 py-3 text-sm font-black text-white">Sign Up</Link>
            <Link to="/login" className="rounded-full border border-[#CFE2A1] bg-white px-7 py-3 text-sm font-black text-[#52670F]">Sign In</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
