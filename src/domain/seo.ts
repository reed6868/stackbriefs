export interface SeoBreadcrumb {
  label: string;
  href?: string | undefined;
}

export type SeoContent =
  | { kind: "website" }
  | { kind: "webpage" }
  | {
      kind: "software-application";
      name: string;
      description: string;
      officialUrl: string;
    };

export interface StructuredDataInput {
  title: string;
  description: string;
  canonicalUrl: string;
  site: URL;
  breadcrumbs?: readonly SeoBreadcrumb[] | undefined;
  content: SeoContent;
}

export interface StructuredDataDocument {
  "@context": "https://schema.org";
  "@graph": ReadonlyArray<Record<string, unknown>>;
}

export function canonicalUrl(site: URL, path: string) {
  const url = new URL(path, site);
  url.search = "";
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

function breadcrumbList(
  site: URL,
  canonical: string,
  breadcrumbs: readonly SeoBreadcrumb[],
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? canonicalUrl(site, item.href) : canonical,
    })),
  };
}

export function buildStructuredData(input: StructuredDataInput): StructuredDataDocument {
  const siteUrl = canonicalUrl(input.site, "/");
  if (input.content.kind === "website") {
    return {
      "@context": "https://schema.org",
      "@graph": [{
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: input.canonicalUrl,
        name: "StackBriefs",
        description: input.description,
      }],
    };
  }

  const graph: Array<Record<string, unknown>> = [{
    "@type": "WebPage",
    "@id": `${input.canonicalUrl}#webpage`,
    url: input.canonicalUrl,
    name: input.title,
    description: input.description,
    isPartOf: { "@id": `${siteUrl}#website` },
  }];

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    graph.push(breadcrumbList(input.site, input.canonicalUrl, input.breadcrumbs));
  }

  if (input.content.kind === "software-application") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${input.canonicalUrl}#software-application`,
      name: input.content.name,
      description: input.content.description,
      url: input.canonicalUrl,
      sameAs: input.content.officialUrl,
      mainEntityOfPage: { "@id": `${input.canonicalUrl}#webpage` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function renderRobotsTxt(indexable: boolean, site: URL) {
  if (!indexable) return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${canonicalUrl(site, "/sitemap-index.xml")}`,
    "",
  ].join("\n");
}
