import type { APIRoute } from "astro";

import { seoIndexableFromEnvironment } from "../content/seo-context";
import { renderRobotsTxt } from "../domain/seo";

export const prerender = true;

export const GET: APIRoute = ({ site, url }) => new Response(
  renderRobotsTxt(
    seoIndexableFromEnvironment(),
    site ?? new URL(url.origin),
  ),
  { headers: { "Content-Type": "text/plain; charset=utf-8" } },
);
