// gate-assessment.constants.ts — Contract GA-1 (D-579)
// Client mirror of mcp/delivery-cycle-mcp/src/lib/gate-assessment-registry.js —
// keep the two in sync; the server validates every submitted payload.
// UI helper copy, NOT prompt text — no Arch-3 concern.

export type AssessmentGrade = 'A' | 'B' | 'C' | 'D' | 'NA';
export type AssessmentRole  = 'submitter' | 'trio_member' | 'consulted' | 'approver';

export interface AssessmentItemDef { key: string; text: string; }

export const ASSESSMENT_GRADES: AssessmentGrade[] = ['A', 'B', 'C', 'D', 'NA'];

export const ASSESSMENT_TOP_LEVEL: AssessmentItemDef[] = [
  { key: 'trio_alignment', text: 'The TRIO has worked together and are aligned.' },
  { key: 'best_practices', text: 'We are learning the best practices for this gate.' },
  { key: 'stakeholders',   text: 'Key stakeholders are aware of key decisions and impacts. They have been able to share their questions and input.' }
];

export const ASSESSMENT_GATE_SUBS: Record<string, AssessmentItemDef[]> = {
  brief_review: [
    { key: 'br_context',   text: 'We presented all key context (aka Context Package).' },
    { key: 'br_challenge', text: 'We challenged the premise of the initiative and assumptions.' },
    { key: 'br_reduce',    text: 'We reduced and simplified. We have an idea of phase 1 vs next.' },
    { key: 'br_outcome',   text: 'We set a business or operational Outcome. We have success metrics.' },
    { key: 'br_dates',     text: 'We set a "Go to Build" target date and discussed/set a "Go to Deploy" target date.' }
  ],
  go_to_build: [
    { key: 'gtb_scenarios',    text: 'We set Scenarios. Main/Primary, Secondary, Gotcha.' },
    { key: 'gtb_requirements', text: 'We have discussed and documented requirements. Our requirements and design target an A solution for main/primary and handle the rest.' },
    { key: 'gtb_decisions',    text: 'We have communicated key decisions with impacts to stakeholders. We are aware of open decisions.' },
    { key: 'gtb_risks',        text: 'We discussed risks including to security, IT, PHI, users, business.' },
    { key: 'gtb_date',         text: 'We set a "Go to Deploy" target date.' }
  ],
  go_to_deploy: [
    { key: 'gtd_pilot',   text: 'We have a "pilot" plan approach.' },
    { key: 'gtd_changes', text: 'We have discussed major changes from Context Brief.' },
    { key: 'gtd_date',    text: 'We set a "Go to Release" target date and have discussed how long to achieve Outcome.' }
  ],
  go_to_release: [
    { key: 'gtr_plan', text: 'We have a "release" plan that targets scaling to the full Outcome, including the needed monitoring and coordination.' },
    { key: 'gtr_date', text: 'We set a "Close Review" target for when we will have completed Outcomes.' }
  ],
  close_review: [
    { key: 'cr_outcomes', text: 'We are aligned on our accomplished Outcomes and success metrics.' },
    { key: 'cr_retro',    text: 'We have a plan to retro what went well and what improvements we could make next time.' },
    { key: 'cr_lessons',  text: 'Lessons worth keeping are captured (OI Library / retro input).' }
  ]
};

/** Items a role must grade at a gate — mirrors requiredItemKeys() server-side. */
export function assessmentItemsFor(gateKey: string, role: AssessmentRole): AssessmentItemDef[] {
  const subs = ASSESSMENT_GATE_SUBS[gateKey] ?? [];
  if (role === 'consulted') {
    return [ASSESSMENT_TOP_LEVEL[2], ...subs];
  }
  return [...ASSESSMENT_TOP_LEVEL, ...subs];
}

/** A text lookup for read-only rendering of stored rows. */
export const ASSESSMENT_ITEM_TEXT: Record<string, string> = Object.fromEntries([
  ...ASSESSMENT_TOP_LEVEL.map(i => [i.key, i.text]),
  ...Object.values(ASSESSMENT_GATE_SUBS).flat().map(i => [i.key, i.text])
]);
