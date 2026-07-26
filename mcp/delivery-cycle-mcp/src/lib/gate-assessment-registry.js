// gate-assessment-registry.js — Contract GA-1 (D-579)
// Single MCP-side source of truth for assessment items. Mirrored client-side
// in angular .../shared/constants/gate-assessment.constants.ts — keep in sync.
// Server validates every submitted assessment against this registry.

'use strict';

const GRADES = ['A', 'B', 'C', 'D', 'NA'];

// Three top-level items at every gate (GA-1 §2).
const TOP_LEVEL_ITEMS = [
  { key: 'trio_alignment', text: 'The TRIO has worked together and are aligned.' },
  { key: 'best_practices', text: 'We are learning the best practices for this gate.' },
  { key: 'stakeholders',   text: 'Key stakeholders are aware of key decisions and impacts. They have been able to share their questions and input.' }
];

// Gate-specific sub-items under best_practices.
const GATE_SUB_ITEMS = {
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

/**
 * The item keys a respondent role must grade at a gate (GA-1 §3).
 * - submitter / trio_member / approver: all three top-level + gate subs.
 * - consulted: stakeholders + gate subs only.
 * @returns {string[]}
 */
function requiredItemKeys(gate_key, respondent_role) {
  const subs = (GATE_SUB_ITEMS[gate_key] || []).map(i => i.key);
  if (respondent_role === 'consulted') {
    return ['stakeholders', ...subs];
  }
  return [...TOP_LEVEL_ITEMS.map(i => i.key), ...subs];
}

/**
 * Validate an assessment payload for a gate + role (GA-1 AC #1/#8).
 * @param {string} gate_key
 * @param {string} respondent_role
 * @param {Array<{item_key:string, grade:string, comment?:string}>} items
 * @returns {{ ok: true, items: Array } | { ok: false, error: string }}
 */
function validateAssessment(gate_key, respondent_role, items) {
  if (!GATE_SUB_ITEMS[gate_key]) {
    return { ok: false, error: `Unknown gate_key '${gate_key}' for assessment.` };
  }
  if (!Array.isArray(items)) {
    return { ok: false, error: 'assessment must be an array of { item_key, grade, comment? }.' };
  }
  const required = requiredItemKeys(gate_key, respondent_role);
  const seen = new Set();
  const clean = [];
  for (const it of items) {
    const key   = it && typeof it.item_key === 'string' ? it.item_key : '';
    const grade = it && typeof it.grade === 'string' ? it.grade : '';
    if (!required.includes(key)) {
      return { ok: false, error: `Unknown or out-of-scope assessment item '${key}' for ${gate_key} (${respondent_role}).` };
    }
    if (seen.has(key)) {
      return { ok: false, error: `Duplicate assessment item '${key}'.` };
    }
    if (!GRADES.includes(grade)) {
      return { ok: false, error: `Assessment item '${key}' needs a grade of A, B, C, D, or N/A — blank is not accepted.` };
    }
    seen.add(key);
    clean.push({
      item_key: key,
      grade,
      comment: (it.comment && String(it.comment).trim()) ? String(it.comment).trim() : null
    });
  }
  const missing = required.filter(k => !seen.has(k));
  if (missing.length > 0) {
    return { ok: false, error: `Assessment incomplete — every presented item needs a grade. Missing: ${missing.join(', ')}.` };
  }
  return { ok: true, items: clean };
}

module.exports = { GRADES, TOP_LEVEL_ITEMS, GATE_SUB_ITEMS, requiredItemKeys, validateAssessment };
