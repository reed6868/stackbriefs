export interface HomeScenario {
  slug: string;
  title: string;
  goal: string;
  prerequisite: string;
  suitableFor: string;
  notSuitableFor: string;
  candidateCount: number;
  dimensionCount: number;
  lastReviewedAt: string;
  fixture: true;
}

export const homeScenarios: readonly HomeScenario[] = [
  {
    slug: "writing-assistants",
    title: "Writing assistants for small teams",
    goal: "Choose an AI writing assistant for shared drafts, review, and export.",
    prerequisite: "Your team can review generated text before publishing it.",
    suitableFor: "Small teams comparing collaboration, privacy, export, and commercial-use constraints.",
    notSuitableFor: "Autonomous publishing or regulated advice without human review.",
    candidateCount: 3,
    dimensionCount: 6,
    lastReviewedAt: "2026-07-14",
    fixture: true,
  },
  {
    slug: "meeting-assistants",
    title: "AI meeting assistants for client calls",
    goal: "Choose a meeting assistant for notes, summaries, and team follow-up.",
    prerequisite: "Participants can be notified when recording or transcription is active.",
    suitableFor: "Teams comparing consent, integrations, export, retention, and regional availability.",
    notSuitableFor: "Covert recording or calls where participants cannot give informed consent.",
    candidateCount: 4,
    dimensionCount: 5,
    lastReviewedAt: "2026-07-15",
    fixture: true,
  },
];

export function sortHomeScenarios<T extends Pick<HomeScenario, "slug" | "title">>(scenarios: readonly T[]) {
  return [...scenarios].sort((left, right) => {
    const titleOrder = left.title
      .trim()
      .toLocaleLowerCase("en-US")
      .localeCompare(right.title.trim().toLocaleLowerCase("en-US"), "en");

    return titleOrder || left.slug.localeCompare(right.slug, "en");
  });
}
