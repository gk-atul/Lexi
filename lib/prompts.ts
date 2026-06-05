export type Channel = "whatsapp" | "push" | "email" | "in-app";
export type Product = "health" | "life" | "auto" | "travel";
export type UseCase = "promotional" | "utility";
export type PnFramework =
  | "pas"
  | "bab"
  | "curiosity-gap"
  | "fomo-scarcity"
  | "social-proof"
  | "achievement-progress"
  | "transactional";

export type UserState =
  | "just-bought"
  | "seen-quote"
  | "dropped-off"
  | "winback-t45"
  | "winback-t3"
  | "post-claim-filed"
  | "post-claim-approved"
  | "post-claim-rejected"
  | "cross-sell"
  | "general";

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  push: "Push Notification",
  email: "Email",
  "in-app": "In-App",
};

export const PRODUCT_LABELS: Record<Product, string> = {
  health: "Health Insurance",
  life: "Life Insurance",
  auto: "Auto Insurance",
  travel: "Travel Insurance",
};

export const USE_CASE_LABELS: Record<UseCase, string> = {
  promotional: "Promotional",
  utility: "Utility",
};

export const USER_STATE_LABELS: Record<UserState, string> = {
  "just-bought": "Just bought a policy",
  "seen-quote": "Seen a quote (no purchase)",
  "dropped-off": "Dropped off post-quote",
  "winback-t45": "Winback — 45 days before expiry",
  "winback-t3": "Winback — 3 days before expiry",
  "post-claim-filed": "Post-claim filed",
  "post-claim-approved": "Post-claim approved",
  "post-claim-rejected": "Post-claim rejected",
  "cross-sell": "Cross-sell (existing customer)",
  general: "General / Other",
};

const CHANNEL_RULES: Record<Channel, string> = {
  whatsapp: `CHANNEL: WhatsApp
MANDATORY STRUCTURE — output the copy field exactly in this format, with a literal blank line between each block:

<intro line>

<context: 1–2 sentences>

<bullets — only if 2+ distinct points; each line starts with "- ">

<nudge: 1 sentence that leads the user toward action — must NOT repeat the CTA wording>

<CTA button text: 3–5 words, action verb first, under 35 chars — must be meaningfully different from the nudge sentence>

RULES:
- Every block MUST be separated by \\n\\n. No exceptions.
- The CTA button line is the LAST line. It must stand alone — do not attach it to the nudge sentence.
- The CTA must NOT echo or repeat any phrase used in the nudge. Write a fresh, specific action label.
- No "Hey" opener. No sign-off. No "Thanks, Team ACKO".
- Weave [Name] organically in the context or nudge — never as the first word.
- Plain text only. No markdown bold (**).
- Emojis allowed in low-risk/marketing only; never in claims or emergencies.

EXAMPLE of correct format:
"Your car cover expires in 3 days.

Renewing keeps your No Claim Bonus intact and your premium lower. Missing the deadline means losing the discount you've earned, [Name].

- Your NCB discount disappears if you let it lapse
- A fresh policy costs more and requires a new inspection

Don't drive unprotected — renew before the deadline.

Renew my policy"`,

  push: `CHANNEL: Push Notification

LENGTH — non-negotiable:
- Headline: STRICT maximum 33 characters (count every character including spaces). Ideal is 26 or fewer — phones truncate past this. Do not exceed 33 under any circumstance.
- Body: STRICT maximum 75 characters (count every character including spaces). Aim for under 10 words — sub-10-word notifications get ~2× higher engagement.
- Both headline and body must be complete sentences. Never trail off.

STRUCTURE:
- One CTA per notification. Never ask the user to do more than one thing.
- Put the most important information first — users read the first few words and decide whether to tap.
- CTA (if included as a deep-link label): 2–5 words, action verb first (e.g. "Renew my policy", "See my NCB", "Check my cover").

MESSAGE FRAMING:
- Lead with the benefit, not the action. "Your NCB discount expires Friday" beats "Renew your policy now."
- Be specific. Vague copy ("Check this out!") performs far worse than copy that states exactly what the user gets.
- Use urgency only when it is real (actual expiry date, actual deadline). Words like "today", "now", "ending" drive strong engagement only when genuine — false urgency trains users to ignore future messages.
- Preferred power words: today, now, soon, ending, just for you, new, save, off, bonus, reward.

PERSONALISATION:
- Reference what the user actually has or did — not just their name. Behavioural context ("Your NCB expires in 3 days", "Your claim has been approved") drives 4× higher reaction rates than name-only personalisation.
- Name-only personalisation ("Hey [Name]!") lifts open rates by only ~9% — always pair it with a specific policy detail or event.
- Always prefer event-triggered framing (real user action or state) over generic broadcast copy.

EMOJIS:
- Use 1 emoji per notification when the context is low-risk or marketing. Emojis lift CTR from ~3% to ~9.6%.
- Place emojis to replace a word or add emotion — not as decoration.
- Best-performing emojis for insurance/finance contexts: ⏳ ✅ 🔔 💙 ⚡
- Never use emojis in claims, rejections, or any sensitive/distressing context.
- Emojis count toward the character limit.

FORBIDDEN:
- Multiple CTAs or multiple asks in one notification.
- Generic broadcast language: "Big news!", "Don't miss out!", "We have something for you".
- Name-only personalisation with no substantive context.
- Fake or exaggerated urgency.
- The words: "instantly", "instant policy", "click here", "act now", "guaranteed".
- Clickbait that doesn't deliver on its promise.`,

  email: `CHANNEL: Email
- Subject line: under 8 words. State the actual thing — no vague subjects.
- Max 1 emoji in subject.
- Most important info + CTA in the first 2 lines (first fold).
- Start heading with "we" or "you".
- No names/personalisation in the heading.
- Use bullets for details.
- No sign-off with "Team ACKO".`,

  "in-app": `CHANNEL: In-App Copy
- Shortest format. Every word earns its place.
- Prioritise action clarity over personality.
- No marketing language.
- Help text near the decision point.
- Use progressive disclosure for complex terms.`,
};

export const PN_FRAMEWORK_META: Record<
  PnFramework,
  { label: string; description: string; bestFor: string }
> = {
  pas: {
    label: "PAS",
    description: "Problem → Agitate → Solution",
    bestFor: "Re-engagement, drop-off",
  },
  bab: {
    label: "BAB",
    description: "Before → After → Bridge",
    bestFor: "Onboarding, upsell",
  },
  "curiosity-gap": {
    label: "Curiosity Gap",
    description: "Withhold the payoff",
    bestFor: "Discovery, re-engagement",
  },
  "fomo-scarcity": {
    label: "FOMO",
    description: "Scarcity + real urgency",
    bestFor: "Expiry, deadlines",
  },
  "social-proof": {
    label: "Social Proof",
    description: "What others are doing",
    bestFor: "Cross-sell, trust",
  },
  "achievement-progress": {
    label: "Progress",
    description: "Milestone + next step",
    bestFor: "NCB, streaks, renewals",
  },
  transactional: {
    label: "Transactional",
    description: "Event-triggered delivery",
    bestFor: "Claims, policy events",
  },
};

const PN_FRAMEWORK_RULES: Record<PnFramework, string> = {
  pas: `REQUIRED FRAMEWORK: PAS — Problem, Agitate, Solution
Title = the problem, specific to this user. Body = why it hurts (agitate) + the fix (solution).
- Agitation must be real, never exaggerated — false pain erodes trust
- Solution should feel like relief, not pressure
- Example: Title "Your NCB discount is at risk" / Body "A lapsed policy means starting over. Renew today to keep it."`,

  bab: `REQUIRED FRAMEWORK: BAB — Before, After, Bridge
Title = the current (less good) state the user is in. Body = the better state + how to get there in one step.
- "Before" must be instantly recognisable to this user or it won't land
- Bridge should feel like a small, easy action — not a big commitment
- Example: Title "Still uninsured for health costs?" / Body "Cover up to ₹5L from day one. Start in 2 minutes."`,

  "curiosity-gap": `REQUIRED FRAMEWORK: Curiosity Gap
Deliberately withhold the payoff to make tapping feel irresistible (information gap theory).
- Title opens a question the brain wants to resolve
- Body hints at the answer without giving it away
- The payoff on tap MUST deliver — disappointing reveals destroy future message credibility
- Curiosity power words: new, just updated, turns out, here's why, something changed, worth seeing
- Example: Title "Your renewal has a surprise" / Body "Check what's different in your new quote."`,

  "fomo-scarcity": `REQUIRED FRAMEWORK: FOMO + Scarcity
Combine loss aversion with real scarcity signals. Real deadlines outperform implied urgency.
- ONLY use real deadlines — a fixed date, hours remaining, or genuine stock/offer limit
- Never fake scarcity: users who tap and find the offer still running lose trust permanently
- Frame around what the user LOSES if they don't act, not just what they gain
- Urgency power words: today, expires, ends [date], hours left, last chance, ⏳
- Example: Title "NCB discount ends in 2 days ⏳" / Body "Renew before [date] to keep your 25% off."`,

  "social-proof": `REQUIRED FRAMEWORK: Social Proof
Use the behaviour of others to validate action and reduce hesitation.
- Specificity is essential: "12,000 ACKO customers renewed this month" > "thousands of customers"
- Social signal must be relevant to this user's product and situation
- Best when the user is hesitant or has seen a quote but not purchased
- Example: Title "12,000 people renewed this week" / Body "Join them and keep your NCB intact."`,

  "achievement-progress": `REQUIRED FRAMEWORK: Achievement / Progress
Reference the user's real progress, then make the next step feel small (Zeigarnik Effect).
- Progress MUST be real and from actual user data — fabricated milestones destroy the effect
- Acknowledge the achievement first, then position the next action as the natural follow-through
- Works especially well for NCB milestones, claim-free years, renewal streaks
- Example: Title "3 claim-free years — well done ✅" / Body "Your NCB is at 35%. Renew now to protect it."`,

  transactional: `REQUIRED FRAMEWORK: Transactional / Event-Triggered
This is the highest-performing PN type (avg 69% open rate, Localytics). Relevance is built in.
- Trigger: a real user action or system event (payment, claim update, policy change, renewal due)
- Structure: [Event] → [What it means for the user] → [Optional next step]
- Add a CTA only when it's genuinely useful — confirmation alone is sometimes the entire value
- Never force persuasion into a transactional message; the event does the work
- Example: Title "Your claim is approved ✅" / Body "₹18,500 reaches your account in 2 days."`,
};

export interface FeedbackExample {
  copy: string;
  formula: string;
  tov_note: string;
}

function buildFeedbackBlock(
  good: FeedbackExample[],
  bad: FeedbackExample[]
): string {
  if (good.length === 0 && bad.length === 0) return "";

  const lines: string[] = ["\n---", "FEEDBACK FROM PREVIOUS GENERATIONS:"];

  if (good.length > 0) {
    lines.push(
      "\nCOPIES THAT WORKED WELL — study these, draw from their structure and tone:"
    );
    good.forEach((e, i) => {
      lines.push(`\n${i + 1}. "${e.copy}"`);
      if (e.formula) lines.push(`   Formula: ${e.formula}`);
      if (e.tov_note) lines.push(`   Why it worked: ${e.tov_note}`);
    });
  }

  if (bad.length > 0) {
    lines.push(
      "\nCOPIES TO AVOID — these were rejected; do not repeat their patterns:"
    );
    bad.forEach((e, i) => {
      lines.push(`\n${i + 1}. "${e.copy}"`);
      if (e.formula) lines.push(`   Formula used: ${e.formula}`);
      if (e.tov_note) lines.push(`   Issue: ${e.tov_note}`);
    });
  }

  lines.push("---\n");
  return lines.join("\n");
}

// ─── Drip angle assignment ────────────────────────────────────────────────────
// Each day in a drip journey is assigned a distinct angle so no two touchpoints
// feel like duplicates. The angle rotates through a fixed sequence and is
// explicitly injected into the prompt so the model cannot default to "expiry urgency" every time.

const DRIP_ANGLES = [
  {
    name: "Problem awareness",
    instruction:
      "Establish what is at stake for the user — name the specific risk or consequence clearly. Do NOT lead with urgency or a deadline. The goal is to make the user understand the situation, not to pressure them.",
  },
  {
    name: "Loss framing",
    instruction:
      "Focus entirely on what the user LOSES by not acting — not what they gain. Make the loss concrete and personal (e.g., a specific discount, a benefit they've earned). Do not repeat the deadline framing from Day 1.",
  },
  {
    name: "Social proof",
    instruction:
      "Lead with what other similar users are doing or have done. Use specificity — a number, a stat, or a peer behaviour signal. Do not mention expiry or deadlines. Build confidence through belonging.",
  },
  {
    name: "Achievement / progress",
    instruction:
      "Acknowledge something the user has already done or earned (e.g., NCB built up, claim-free years, time as a customer). Then position the next action as protecting or extending that progress. Tone is warm and congratulatory, not urgent.",
  },
  {
    name: "Benefit spotlight",
    instruction:
      "Pick one specific tangible benefit the user gets from acting — not a general 'save money' message, but a precise outcome (e.g., exact discount %, cashless garages, zero inspection). Make this the entire message. No urgency language.",
  },
  {
    name: "Reframe / fresh angle",
    instruction:
      "Approach the situation from a completely different angle — not expiry, not loss, not urgency. Try curiosity, a surprising fact, or a benefit the user may not have considered. The copy should feel like a different conversation, not a follow-up.",
  },
  {
    name: "Urgency escalation",
    instruction:
      "Now escalate urgency — use a real deadline if available (specific date or days remaining). The tone shifts from informative to action-driving. This should feel meaningfully more urgent than all prior messages, not just a repeat with stronger words.",
  },
  {
    name: "Final resolution",
    instruction:
      "This is the last message. Make it feel final — clear, direct, and calm. No more build-up. State the consequence of not acting once, then give the clearest possible CTA. The copy should feel like a closing door, not another reminder.",
  },
];

function buildDripBlock(day: number, totalDays: number): string {
  // Map day position to an angle index
  // Day 1 always = awareness, last day always = final resolution
  // Middle days cycle through the remaining angles
  let angleIndex: number;
  if (day === 1) {
    angleIndex = 0;
  } else if (day === totalDays) {
    angleIndex = DRIP_ANGLES.length - 1;
  } else {
    // Distribute middle days across angles 1–6 (skip first and last)
    const middleCount = totalDays - 2;
    const middleAngles = DRIP_ANGLES.slice(1, DRIP_ANGLES.length - 1);
    const pos = day - 2; // 0-indexed position among middle days
    angleIndex = 1 + (pos % middleAngles.length);
  }

  const angle = DRIP_ANGLES[angleIndex];

  return `DRIP JOURNEY CONTEXT:
This is Day ${day} of ${totalDays} in a multi-day drip campaign.

MANDATORY ANGLE FOR THIS DAY — "${angle.name}":
${angle.instruction}

ANTI-DUPLICATION RULES (strictly enforced):
- Do NOT open with expiry/deadline urgency unless the angle above explicitly calls for it.
- Do NOT use the same emotional hook as a standard renewal reminder.
- The opening line must be clearly different in framing from "Your policy expires in X days."
- Each day in this drip uses a different angle — this day's angle is locked to "${angle.name}". Stick to it.
- If you find yourself writing "expires", "deadline", or "renew now" as the headline on any day other than the urgency or final-resolution days, you are doing it wrong — rewrite.
`;
}

export function buildPrompt(
  tov: string,
  channel: Channel,
  product: Product,
  useCase: UseCase | undefined,
  context: string,
  variantCount: number,
  pnFramework?: PnFramework,
  feedbackExamples?: { good: FeedbackExample[]; bad: FeedbackExample[] },
  dripContext?: { day: number; totalDays: number },
  learnedInsights?: string[]
): string {
  const feedbackBlock = feedbackExamples
    ? buildFeedbackBlock(feedbackExamples.good, feedbackExamples.bad)
    : "";

  const insightsBlock =
    learnedInsights && learnedInsights.length > 0
      ? [
          "\n--- LEARNED WRITING RULES ---",
          "These rules were derived from past feedback on copy for this channel and product.",
          "Apply them alongside the channel rules above — they reflect what actually resonates with this audience:",
          ...learnedInsights.map((r, i) => `${i + 1}. ${r}`),
          "--- END LEARNED RULES ---\n",
        ].join("\n")
      : "";

  const dripBlock = dripContext
    ? buildDripBlock(dripContext.day, dripContext.totalDays)
    : "";

  return `You are a copy and communications generator for ACKO, an Indian digital insurance company.

Below is ACKO's complete Tone of Voice guide. Follow it exactly.

---
TONE OF VOICE GUIDE:
${tov}
---

${CHANNEL_RULES[channel]}
${pnFramework && channel === "push" ? `\n${PN_FRAMEWORK_RULES[pnFramework]}\n` : ""}${feedbackBlock}${insightsBlock}LINE OF BUSINESS: ${PRODUCT_LABELS[product]}
USE CASE TYPE: ${useCase ? USE_CASE_LABELS[useCase] : "General"}${useCase === "promotional" ? " — drop-off re-engagement, new campaign/launch, general engagement, offers and discounts" : useCase === "utility" ? " — renewals, service messages, VAS messages, reward statements" : ""}
${dripBlock}CONTEXT / PROBLEM STATEMENT: ${context}

Generate ${variantCount} distinct copy variant${variantCount > 1 ? "s" : ""} for the above.

Requirements for each variant:
- Follow the ToV guide strictly — the master instruction block, forbidden phrases, plain language word list, and channel rules all apply
- Format appropriately for the channel specified above (character limits, structure, emoji rules)
- Use a different copy formula or hook angle for each variant (do not paraphrase)
- Be transparent about exclusions, deductibles, or limits if relevant
- Never overpromise
- Use second person (you/your), active voice, sentence case (title case only for product/plan names)

QUALITY BAR — every variant must score 4 or above on ALL of the following dimensions. Use these as a checklist before finalising each variant:
- key_hook ≥ 4: The opening line immediately earns attention and is specific to this user's situation — not generic.
- contextualisation ≥ 4: The copy references the user's actual product, state, or circumstance. It should feel like it was written for them, not a template.
- personalisation ≥ 4: At least two personalisation signals are present — e.g. [Name] placeholder PLUS a specific policy detail (expiry date, NCB %, product type, claim status). A lone [Name] scores 3 at best.
- user_first ≥ 4: Every sentence leads with what the user gains or avoids — not what ACKO does.
- cta_clarity ≥ 4: The CTA tells the user exactly what will happen when they tap it. "Renew my policy" > "Renew now".
- positive_tone ≥ 4: Calm, confident, and helpful. Not alarmist or pushy.
- emotional_appeal ≥ 4: Connects to a real emotion — peace of mind, relief, pride in being prepared — without being manipulative.
- trust_building ≥ 4: At least one concrete detail (number, fact, or specific outcome) that makes the message credible.

If a draft variant would score below 4 on any dimension, rewrite it before including it in the response.

For each variant also provide:
- formula: the copy formula used (e.g. "Status + meaning + next step")
- tov_note: one short sentence on the key ToV rule applied
- crm_scores: honest score out of 5 for each parameter (key_hook, contextualisation, personalisation, user_first, cta_clarity, positive_tone, emotional_appeal, trust_building) — do not inflate scores
- crm_total: weighted average out of 5 using these weights (they sum to 100%): key_hook 20%, contextualisation 15%, personalisation 15%, user_first 10%, cta_clarity 10%, positive_tone 10%, emotional_appeal 10%, trust_building 10%

IMPORTANT: The "copy" field must always be a plain string. Never return "copy" as a nested object.
For push notifications specifically: the copy field MUST be exactly two lines separated by a single newline character — line 1 is the headline (≤33 chars), line 2 is the body (≤75 chars). No other format is acceptable. Example: "NCB expires in 2 days ⏳\nRenew now to keep your 25% discount."

Respond ONLY with a valid JSON array, no markdown, no explanation. Format:
[
  {
    "copy": "...",
    "formula": "...",
    "tov_note": "...",
    "crm_scores": {
      "key_hook": 0,
      "contextualisation": 0,
      "personalisation": 0,
      "user_first": 0,
      "cta_clarity": 0,
      "positive_tone": 0,
      "emotional_appeal": 0,
      "trust_building": 0
    },
    "crm_total": 0.0
  }
]`;
}
