import type { Event, SponsorPackageTier, SponsorMatch, SponsorProposalResult } from '@/types';

// Lightweight, explainable "AI" sponsor engine. It is fully deterministic so it
// works offline with no API key, while reading like generated copy. Features 3
// (proposal + email + Gold/Silver/Bronze packages) and 4 (sponsor matching).

interface ProposalArgs {
  event: Event;
  audienceSize: number;
  expectedReach: number;
  sponsorBenefits: string;
}

function inr(n: number): string {
  return `Rs.${Math.round(n).toLocaleString('en-IN')}`;
}

// Tier pricing scales with audience + reach so numbers feel grounded.
export function buildPackages(audienceSize: number, expectedReach: number): SponsorPackageTier[] {
  const reachFactor = Math.max(1, expectedReach / 1000);
  const base = Math.max(15000, Math.round((audienceSize * 180 + reachFactor * 4000) / 1000) * 1000);
  const gold = Math.round((base * 2) / 1000) * 1000;
  const silver = Math.round((base * 1.1) / 1000) * 1000;
  const bronze = Math.round((base * 0.55) / 1000) * 1000;

  return [
    {
      tier: 'Gold',
      price: gold,
      benefits: [
        'Title billing: "Powered by <Your Brand>" on all event assets',
        'Keynote / opening speaking slot (up to 10 min)',
        'Premium booth in the highest-footfall zone',
        'Logo on stage backdrop, posters, certificates & emails',
        'Dedicated social media feature + post-event report',
        `First access to the opted-in attendee list (${audienceSize}+ attendees)`,
      ],
    },
    {
      tier: 'Silver',
      price: silver,
      benefits: [
        'Logo on posters, website and digital certificates',
        'Standard booth space at the venue',
        'Shout-out during the event + one social media post',
        'Branded insert in the participant welcome kit',
      ],
    },
    {
      tier: 'Bronze',
      price: bronze,
      benefits: [
        'Logo on the website and digital backdrop',
        'Group social media mention',
        'Thank-you note in the closing ceremony',
      ],
    },
  ];
}

export function generateProposal(args: ProposalArgs): SponsorProposalResult {
  const { event, audienceSize, expectedReach, sponsorBenefits } = args;
  const packages = buildPackages(audienceSize, expectedReach);
  const matches = matchSponsors({ event, audienceSize, expectedReach });
  const where = [event.venue, event.city].filter(Boolean).join(', ');
  const benefitsList = sponsorBenefits
    .split(/[\n,]/)
    .map(b => b.trim())
    .filter(Boolean);
  const benefitsBlock = benefitsList.length
    ? benefitsList.map(b => `  • ${b}`).join('\n')
    : '  • Brand visibility across all event touchpoints\n  • Direct access to a high-intent audience\n  • Lead generation and recruitment opportunities';

  const proposal = `SPONSORSHIP PROPOSAL
${event.title}

ABOUT THE EVENT
${event.description}

Date: ${event.date}${event.start_time ? ` · ${event.start_time}${event.end_time ? `–${event.end_time}` : ''}` : ''}
Venue: ${where || 'To be announced'}
Category: ${event.category}
Expected attendance: ${audienceSize.toLocaleString('en-IN')}
Projected total reach (on-ground + online): ${expectedReach.toLocaleString('en-IN')}

WHY PARTNER WITH US
${benefitsBlock}

WHAT YOUR BRAND GETS
${packages
    .map(p => `${p.tier} — ${inr(p.price)}\n${p.benefits.map(b => `  • ${b}`).join('\n')}`)
    .join('\n\n')}

RECOMMENDED SPONSOR FIT
${matches
    .map(m => `  • ${m.category} (fit ${m.fitScore}%) — ${m.sponsorTypes.join(', ')}`)
    .join('\n')}

NEXT STEPS
We would love to tailor a package to your goals. Reply to this proposal and we
will set up a 15-minute call to finalise your partnership for ${event.title}.`;

  const emailPitch = `Subject: Partner with ${event.title} — reach ${expectedReach.toLocaleString('en-IN')} ${event.category} enthusiasts

Hi there,

I'm reaching out about ${event.title}, a ${event.category.toLowerCase()} event on ${event.date}${where ? ` at ${where}` : ''}. We're expecting ${audienceSize.toLocaleString('en-IN')} attendees and a projected total reach of ${expectedReach.toLocaleString('en-IN')} across on-ground and online channels.

We think your brand is a strong fit because our audience maps closely to ${matches[0]?.category.toLowerCase() || 'your target market'}. Sponsoring gives you:
${benefitsBlock}

We have three partnership tiers:
  • Gold — ${inr(packages[0].price)}
  • Silver — ${inr(packages[1].price)}
  • Bronze — ${inr(packages[2].price)}

Could we grab 15 minutes this week to find the right fit? Happy to share the full proposal deck.

Best regards,
The ${event.title} Team`;

  return { proposal, emailPitch, packages, matches };
}

// --- Feature 4: AI Sponsor Matching ---------------------------------------

interface MatchArgs {
  event: Event;
  audienceSize: number;
  expectedReach: number;
}

// Category → likely sponsor industries. Practical, explainable mapping.
const CATEGORY_SPONSORS: Record<string, { category: string; types: string[] }[]> = {
  technology: [
    { category: 'Cloud & Developer Tools', types: ['Cloud providers', 'IDE / DevTools vendors', 'API platforms'] },
    { category: 'Consumer Electronics', types: ['Laptop brands', 'Peripherals', 'Smartphone OEMs'] },
    { category: 'EdTech & Upskilling', types: ['Online course platforms', 'Certification bodies'] },
  ],
  hackathon: [
    { category: 'Developer Platforms', types: ['Cloud credits', 'Database vendors', 'Auth/Payment APIs'] },
    { category: 'Tech Recruiting', types: ['Hiring platforms', 'Product companies hiring engineers'] },
    { category: 'Food & Energy', types: ['Energy drinks', 'Snack brands', 'Coffee chains'] },
  ],
  education: [
    { category: 'EdTech', types: ['LMS platforms', 'Course marketplaces', 'Test-prep brands'] },
    { category: 'Publishing & Stationery', types: ['Textbook publishers', 'Notebook / stationery brands'] },
    { category: 'Career Services', types: ['Job boards', 'Internship platforms'] },
  ],
  business: [
    { category: 'SaaS & Productivity', types: ['CRM tools', 'Collaboration suites', 'Fintech'] },
    { category: 'Banking & Finance', types: ['Business banks', 'Payment gateways', 'Investment platforms'] },
    { category: 'Consulting', types: ['Advisory firms', 'Coworking spaces'] },
  ],
  gaming: [
    { category: 'Gaming Hardware', types: ['GPU brands', 'Gaming peripherals', 'Monitor brands'] },
    { category: 'Game Publishers', types: ['Esports orgs', 'Game studios', 'Streaming platforms'] },
    { category: 'Energy & Snacks', types: ['Energy drinks', 'Quick-service food'] },
  ],
  culture: [
    { category: 'Lifestyle & FMCG', types: ['Apparel brands', 'Beverages', 'Personal care'] },
    { category: 'Media & Entertainment', types: ['OTT platforms', 'Radio / streaming', 'Local media'] },
    { category: 'Hospitality', types: ['Cafes & restaurants', 'Travel brands'] },
  ],
};

function categoryKey(category: string): keyof typeof CATEGORY_SPONSORS {
  const c = category.toLowerCase();
  if (/(tech|ai|ml|data|software|dev|cloud|cyber)/.test(c)) return 'technology';
  if (/(hack|coding|code)/.test(c)) return 'hackathon';
  if (/(edu|bootcamp|workshop|learn|college|student)/.test(c)) return 'education';
  if (/(business|startup|entrepreneur|finance|pitch)/.test(c)) return 'business';
  if (/(game|gaming|esport|pubg)/.test(c)) return 'gaming';
  if (/(music|art|culture|fest|fashion|food|cultural)/.test(c)) return 'culture';
  return 'technology';
}

export function matchSponsors(args: MatchArgs): SponsorMatch[] {
  const { event, audienceSize, expectedReach } = args;
  const key = categoryKey(event.category);
  const candidates = CATEGORY_SPONSORS[key];

  // Scale factor: bigger audience + reach => higher confidence in the fit.
  const sizeBoost = Math.min(18, Math.round(audienceSize / 25));
  const reachBoost = Math.min(14, Math.round(expectedReach / 2500));

  return candidates.map((c, index) => {
    const fitScore = Math.max(55, Math.min(98, 92 - index * 9 + sizeBoost + reachBoost));
    const rationale =
      index === 0
        ? `Closest match to a ${event.category.toLowerCase()} audience of ~${audienceSize.toLocaleString('en-IN')}; these brands actively chase this exact crowd for awareness and hiring.`
        : index === 1
          ? `Strong secondary fit — relevant to your attendees and motivated by the ${expectedReach.toLocaleString('en-IN')} projected reach for brand lift.`
          : `Reliable add-on fit; good for in-kind support (product, food, swag) that improves attendee experience at lower cash cost.`;
    return { category: c.category, sponsorTypes: c.types, fitScore, rationale };
  });
}
