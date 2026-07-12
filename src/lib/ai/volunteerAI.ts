import type { RoleRecommendation } from '@/types';

// Feature 5 — AI Volunteer Recommendation Engine.
// Transparent scoring: each role defines the skills it rewards. We match the
// volunteer's skills (and availability) against them and explain every score,
// so recommendations are practical and defensible.

interface RoleDef {
  role: string;
  blurb: string;
  keywords: string[];      // skills that strongly indicate fit
  needsLongHours?: boolean; // benefits from full-day availability
}

const ROLES: RoleDef[] = [
  {
    role: 'Registration Desk',
    blurb: 'Greet attendees, verify QR/codes, and run smooth check-in.',
    keywords: ['communication', 'organization', 'organisation', 'people', 'hospitality', 'friendly', 'crowd', 'management', 'attention to detail', 'detail'],
  },
  {
    role: 'Technical Support',
    blurb: 'Handle AV, Wi-Fi, projectors, livestream and on-stage tech.',
    keywords: ['technical', 'tech', 'it', 'networking', 'av', 'audio', 'video', 'hardware', 'troubleshooting', 'problem solving', 'coding', 'electronics', 'computer'],
  },
  {
    role: 'Social Media',
    blurb: 'Capture moments, post live updates, and grow online reach.',
    keywords: ['social media', 'content', 'design', 'photography', 'video', 'writing', 'marketing', 'canva', 'editing', 'creative', 'communication'],
  },
  {
    role: 'Stage Management',
    blurb: 'Run the schedule, cue speakers, and keep sessions on time.',
    keywords: ['leadership', 'time management', 'organization', 'organisation', 'public speaking', 'anchoring', 'coordination', 'planning', 'confident', 'multitasking'],
    needsLongHours: true,
  },
  {
    role: 'Coordination',
    blurb: 'Connect teams, manage logistics, and solve issues on the fly.',
    keywords: ['coordination', 'logistics', 'leadership', 'teamwork', 'planning', 'management', 'communication', 'problem solving', 'organization', 'organisation'],
    needsLongHours: true,
  },
];

function availabilityScore(availability: string, needsLongHours?: boolean): { score: number; reason?: string } {
  const a = availability.toLowerCase();
  const isFullDay = /(full|all day|whole|entire|flexible|anytime|both)/.test(a);
  if (!availability.trim()) return { score: 0 };
  if (needsLongHours && isFullDay) return { score: 12, reason: 'Full-day availability suits this role’s continuous coverage.' };
  if (needsLongHours && !isFullDay) return { score: 4, reason: 'Partial availability — works, but full-day is ideal here.' };
  return { score: 8, reason: 'Stated availability fits this role’s shift pattern.' };
}

function fitLabel(score: number): RoleRecommendation['fit'] {
  if (score >= 75) return 'Excellent';
  if (score >= 55) return 'Strong';
  if (score >= 35) return 'Good';
  return 'Fair';
}

export function recommendRoles(skills: string[], availability = ''): RoleRecommendation[] {
  const normalized = skills.map(s => s.trim().toLowerCase()).filter(Boolean);

  const recs = ROLES.map((def) => {
    const matched: string[] = [];
    for (const skill of normalized) {
      if (def.keywords.some(k => skill.includes(k) || k.includes(skill))) {
        matched.push(skill);
      }
    }
    const skillPoints = Math.min(80, matched.length * 26);
    const avail = availabilityScore(availability, def.needsLongHours);
    // Small baseline so every role gets an explainable, non-zero score.
    const score = Math.min(98, 10 + skillPoints + avail.score);

    const reasons: string[] = [];
    if (matched.length) {
      const unique = Array.from(new Set(matched)).slice(0, 4);
      reasons.push(`Matches ${matched.length} relevant skill${matched.length > 1 ? 's' : ''}: ${unique.join(', ')}.`);
    } else {
      reasons.push('No direct skill match — a good role to learn on the job.');
    }
    if (avail.reason) reasons.push(avail.reason);
    reasons.push(def.blurb);

    return { role: def.role, score, fit: fitLabel(score), reasons };
  });

  return recs.sort((a, b) => b.score - a.score);
}
