export const shellNavigation = [
  { label: "Browse scenarios", href: "/#scenarios" },
  { label: "Methodology", href: "/methodology" },
  { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
] as const;

export function isCurrentPage(href: string, currentPath: string) {
  const path = href.split("#")[0];
  const normalizedCurrentPath = currentPath === "/"
    ? "/"
    : currentPath.replace(/\.html$/, "").replace(/\/$/, "");

  return path !== "/" && path === normalizedCurrentPath;
}

export function isCurrentSection(href: string, currentUrl: URL) {
  const target = new URL(href, currentUrl);

  return target.pathname === currentUrl.pathname && target.hash === currentUrl.hash;
}

export function containTabFocus(event: KeyboardEvent, dialog: HTMLDialogElement) {
  if (event.key !== "Tab") return;

  const focusable = dialog.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) return;

  if (event.shiftKey && dialog.ownerDocument.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && dialog.ownerDocument.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
