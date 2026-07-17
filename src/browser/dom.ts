export function requiredElement<Element extends globalThis.Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<Element>(selector);
  if (!element) throw new Error(`Required element is missing: ${selector}`);
  return element;
}
