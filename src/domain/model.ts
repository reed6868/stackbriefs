import type {
  CandidateContent,
  DimensionContent,
  OfferContent,
  ScenarioContent,
  SourceContent,
  ToolContent,
  PublicationHistory,
} from "../content/schema";
import type { EvidenceResolution } from "./evidence-types";

export type BuildTarget = "development" | "preview" | "production";

export interface PublicationOptions {
  target: BuildTarget;
  asOf: string;
  publicationHistory?: PublicationHistory;
}

export interface PublicationIssue {
  code: string;
  path: string;
  message: string;
}

export interface DomainClaim {
  dimensionId: string;
  dimension: DimensionContent;
  subjectType: "candidate" | "tool";
  subjectId: string;
  claimKey: string;
  evidenceCategory: CandidateContent["claimBindings"][string]["evidenceCategory"];
  scope: CandidateContent["claimBindings"][string]["scope"];
  sources: readonly SourceContent[];
  evidence: EvidenceResolution;
}

export interface DomainCandidate extends Omit<CandidateContent, "claimBindings"> {
  tool: ToolContent;
  claims: readonly DomainClaim[];
}

export interface DomainScenario extends Omit<ScenarioContent, "candidateIds"> {
  candidates: readonly DomainCandidate[];
}

export interface DomainOffer extends OfferContent {
  tool: ToolContent;
  evidence: readonly SourceContent[];
}

interface RouteOutcomeBase {
  id: string;
  slug: string;
  fixture: boolean;
}

export interface PublishedScenarioOutcome extends RouteOutcomeBase {
  kind: "published";
  scenario: DomainScenario;
}

export interface HiddenScenarioOutcome extends RouteOutcomeBase {
  kind: "hidden";
  reason: "draft" | "fixture_excluded" | "invalid" | "never_published";
}

export interface BlockedScenarioOutcome extends RouteOutcomeBase {
  kind: "blocked";
  title: string;
  firstPublishedAt?: string | undefined;
  issues: readonly PublicationIssue[];
}

export interface RetiredScenarioOutcome extends RouteOutcomeBase {
  kind: "retired";
  title: string;
  firstPublishedAt?: string | undefined;
}

export interface ReplacementScenarioOutcome extends RouteOutcomeBase {
  kind: "replacement";
  title: string;
  firstPublishedAt?: string | undefined;
  redirectTo: { slug: string; href: string };
  statusCode: 301;
}

export type ScenarioPublicationOutcome =
  | PublishedScenarioOutcome
  | HiddenScenarioOutcome
  | BlockedScenarioOutcome
  | RetiredScenarioOutcome
  | ReplacementScenarioOutcome;

export interface ExposedToolOutcome extends RouteOutcomeBase {
  kind: "exposed-tool";
  tool: ToolContent;
  scenarioIds: readonly string[];
}

export interface HiddenToolOutcome extends RouteOutcomeBase {
  kind: "hidden";
  reason: "draft" | "fixture_excluded" | "invalid" | "not_exposed" | "never_published";
}

export interface BlockedToolOutcome extends RouteOutcomeBase {
  kind: "blocked";
  name: string;
  firstPublishedAt?: string | undefined;
  issues: readonly PublicationIssue[];
}

export interface RetiredToolOutcome extends RouteOutcomeBase {
  kind: "retired";
  name: string;
  firstPublishedAt?: string | undefined;
}

export interface ReplacementToolOutcome extends RouteOutcomeBase {
  kind: "replacement";
  name: string;
  firstPublishedAt?: string | undefined;
  redirectTo: { slug: string; href: string };
  statusCode: 301;
}

export type ToolPublicationOutcome =
  | ExposedToolOutcome
  | HiddenToolOutcome
  | BlockedToolOutcome
  | RetiredToolOutcome
  | ReplacementToolOutcome;

export interface PublicContentInputs {
  discoveryScenarioSlugs: readonly string[];
  decisionRouteSlugs: readonly string[];
  statusScenarioSlugs: readonly string[];
  scenarioRedirects: ReadonlyArray<{ from: string; to: string; statusCode: 301 }>;
  exposedToolSlugs: readonly string[];
  statusToolSlugs: readonly string[];
  toolRedirects: ReadonlyArray<{ from: string; to: string; statusCode: 301 }>;
  sitemapPaths: readonly string[];
  structuredDataPaths: readonly string[];
  indexable: boolean;
}

export interface PublicationAssembly {
  target: BuildTarget;
  asOf: string;
  scenarioOutcomes: readonly ScenarioPublicationOutcome[];
  toolOutcomes: readonly ToolPublicationOutcome[];
  offers: readonly DomainOffer[];
  issues: readonly PublicationIssue[];
  offerIssues: readonly PublicationIssue[];
  publicInputs: PublicContentInputs;
  releaseReady: boolean;
}
