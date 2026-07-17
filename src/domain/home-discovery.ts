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
  fixture: boolean;
}

export function sortHomeScenarios<T extends Pick<HomeScenario, "slug" | "title">>(scenarios: readonly T[]) {
  return [...scenarios].sort((left, right) => {
    const titleOrder = left.title
      .trim()
      .toLocaleLowerCase("en-US")
      .localeCompare(right.title.trim().toLocaleLowerCase("en-US"), "en");

    return titleOrder || left.slug.localeCompare(right.slug, "en");
  });
}
