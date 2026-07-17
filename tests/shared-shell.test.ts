import { readFile } from "node:fs/promises";

import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it, vi } from "vitest";

import Breadcrumbs from "../src/components/Breadcrumbs.astro";
import SiteFooter from "../src/components/SiteFooter.astro";
import SiteHeader from "../src/components/SiteHeader.astro";
import { containTabFocus, isCurrentSection } from "../src/components/navigation";
import BaseLayout from "../src/layouts/BaseLayout.astro";

const destinations = ["/#scenarios", "/methodology", "/affiliate-disclosure"];

function section(html: string, label: string) {
  const match = html.match(new RegExp(`<nav[^>]+aria-label="${label}"[^>]*>([\\s\\S]*?)<\\/nav>`));

  expect(match, `${label} navigation is rendered`).not.toBeNull();
  return match![1]!;
}

function hrefs(html: string) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("shared shell", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it("treats the scenario anchor as current only at its exact location", () => {
    expect(isCurrentSection("/#scenarios", new URL("https://stackbriefs.test/#scenarios"))).toBe(true);
    expect(isCurrentSection("/#scenarios", new URL("https://stackbriefs.test/"))).toBe(false);
    expect(isCurrentSection("/#scenarios", new URL("https://stackbriefs.test/methodology#scenarios"))).toBe(false);
  });

  it("scopes current-section updates to shell scenario links", async () => {
    const html = await container.renderToString(BaseLayout, {
      props: {
        title: "Reading page | StackBriefs",
        description: "Reading page",
      },
      request: new Request("https://stackbriefs.test/"),
      slots: {
        default: '<h1>Reading page</h1><nav aria-label="On this page"><a href="#details">Details</a></nav>',
      },
    });

    expect(html.match(/<a[^>]+data-shell-section-link/g)).toHaveLength(3);
    expect(section(html, "On this page")).not.toContain("data-shell-section-link");
  });

  it("wraps Tab focus at both boundaries of the mobile menu", () => {
    const closeButton = { focus: vi.fn() };
    const finalLink = { focus: vi.fn() };
    const active = { current: closeButton };
    const dialog = {
      ownerDocument: {
        get activeElement() {
          return active.current;
        },
      },
      querySelectorAll: () => [closeButton, finalLink],
    } as unknown as HTMLDialogElement;
    const backward = {
      key: "Tab",
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    containTabFocus(backward, dialog);

    expect(backward.preventDefault).toHaveBeenCalledOnce();
    expect(finalLink.focus).toHaveBeenCalledOnce();

    active.current = finalLink;
    const forward = {
      key: "Tab",
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    containTabFocus(forward, dialog);

    expect(forward.preventDefault).toHaveBeenCalledOnce();
    expect(closeButton.focus).toHaveBeenCalledOnce();
  });

  it("renders matching approved destinations in desktop and mobile navigation", async () => {
    const html = await container.renderToString(SiteHeader, {
      props: { currentPath: "/methodology" },
    });
    const desktop = section(html, "Primary");
    const mobile = section(html, "Mobile");

    expect(hrefs(desktop)).toEqual(destinations);
    expect(hrefs(mobile)).toEqual(destinations);
    expect(desktop).toMatch(/href="\/methodology"[^>]+aria-current="page"/);
    expect(mobile).toMatch(/href="\/methodology"[^>]+aria-current="page"/);
    expect(html).toMatch(/<button[^>]+aria-label="Open menu"[^>]+aria-expanded="false"[^>]+aria-controls="site-menu"/);
    expect(html).toMatch(/<dialog[^>]+id="site-menu"[^>]+aria-labelledby="mobile-menu-title"/);
  });

  it("keeps standalone shell navigation targets at least 44 CSS pixels tall", async () => {
    const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");

    expect(css).toMatch(
      /:where\(\.desktop-nav, \.site-footer nav\) a\s*{[\s\S]*display:\s*inline-flex;[\s\S]*min-height:\s*2\.75rem;[\s\S]*align-items:\s*center;/,
    );
  });

  it("keeps prohibited product and commercial navigation out of the shell", async () => {
    const html = await container.renderToString(BaseLayout, {
      props: {
        title: "Fixture | StackBriefs",
        description: "Fixture page",
      },
      request: new Request("https://stackbriefs.test/"),
      slots: { default: "<h1>Fixture page</h1>" },
    });

    for (const label of ["login", "search", "tool library", "submit", "rankings", "get deal", "buy now"]) {
      expect(html.toLowerCase()).not.toContain(label);
    }
  });

  it("renders breadcrumb context with the final item marked as current", async () => {
    const html = await container.renderToString(Breadcrumbs, {
      props: {
        items: [
          { label: "Home", href: "/" },
          { label: "Writing assistants", href: "/decision/writing-assistants" },
          { label: "Example Tool" },
        ],
      },
    });

    expect(section(html, "Breadcrumb")).toMatch(/Home[\s\S]*Writing assistants[\s\S]*Example Tool/);
    expect(html).toContain('aria-current="page"');
  });

  it("repeats approved destinations in the footer", async () => {
    const html = await container.renderToString(SiteFooter, {
      props: { currentPath: "/affiliate-disclosure" },
    });
    const footer = section(html, "Footer");

    expect(hrefs(footer)).toEqual(destinations);
    expect(footer).toMatch(/href="\/affiliate-disclosure"[^>]+aria-current="page"/);
  });

  it("uses the same landmarks for fixture and reading layouts", async () => {
    const fixture = await container.renderToString(BaseLayout, {
      props: {
        title: "Fixture | StackBriefs",
        description: "Fixture page",
      },
      request: new Request("https://stackbriefs.test/"),
      slots: { default: "<h1>Fixture page</h1>" },
    });
    const reading = await container.renderToString(BaseLayout, {
      props: {
        title: "Methodology | StackBriefs",
        description: "Reading page",
        reading: true,
        breadcrumbs: [{ label: "Home", href: "/" }, { label: "Methodology" }],
      },
      request: new Request("https://stackbriefs.test/methodology"),
      slots: { default: "<h1>Methodology</h1>" },
    });

    for (const html of [fixture, reading]) {
      expect(html).toContain('href="#main-content"');
      expect(html).toContain("<header");
      expect(html).toContain('<main id="main-content"');
      expect(html).toContain('tabindex="-1"');
      expect(html).toContain("<footer");
    }
    expect(reading).toMatch(/<main[^>]+class="[^"]*reading-layout[^"]*"/);
    for (const label of ["Primary", "Mobile", "Footer"]) {
      expect(section(reading, label)).toMatch(/href="\/methodology"[^>]+aria-current="page"/);
    }
  });
});
