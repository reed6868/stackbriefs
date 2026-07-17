import { httpsUrl, localPublicImagePath } from "./schema/primitives";

interface MdxPosition {
  start?: { line?: number | undefined } | undefined;
}

interface MdxAttribute {
  type: string;
  name?: string | undefined;
  value?: string | object | null | undefined;
}

interface MdxNode {
  type: string;
  name?: string | null | undefined;
  url?: string | undefined;
  attributes?: MdxAttribute[] | undefined;
  children?: MdxNode[] | undefined;
  position?: MdxPosition | undefined;
}

const prohibitedElements = new Set(["base", "embed", "iframe", "link", "meta", "object", "script", "style"]);
const prohibitedNodeTypes = new Set(["html", "mdxFlowExpression", "mdxTextExpression", "mdxjsEsm"]);

function policyError(node: MdxNode, message: string): never {
  const line = node.position?.start?.line;
  throw new Error(`Trusted MDX${line ? ` line ${line}` : ""}: ${message}`);
}

function isInternalHref(value: string) {
  if (/[\u0000-\u001f\\]/.test(value)) return false;
  if (value.startsWith("#")) return value.length > 1;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  return true;
}

function isTrustedMailto(value: string) {
  return /^mailto:[^@\s?]+@[^@\s?]+$/i.test(value);
}

function isApprovedHref(value: string) {
  return isInternalHref(value) || isTrustedMailto(value) || httpsUrl.safeParse(value).success;
}

function validateElement(node: MdxNode) {
  if (!node.name || !/^[a-z][a-z0-9-]*$/.test(node.name)) {
    policyError(node, "only lowercase HTML elements are allowed; arbitrary components are prohibited");
  }
  if (prohibitedElements.has(node.name)) {
    policyError(node, `<${node.name}> is prohibited`);
  }

  const staticAttributes = new Map<string, string | null>();
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== "mdxJsxAttribute" || !attribute.name) {
      policyError(node, "spread and expression attributes are prohibited");
    }
    const name = attribute.name.toLowerCase();
    if (staticAttributes.has(name)) {
      policyError(node, `duplicate attribute ${attribute.name} is prohibited`);
    }
    if (name.startsWith("on") || name.includes(":")) {
      policyError(node, `attribute ${attribute.name} is prohibited`);
    }
    if (typeof attribute.value === "object") {
      policyError(node, `attribute ${attribute.name} must use a static value`);
    }
    staticAttributes.set(name, typeof attribute.value === "string" ? attribute.value : null);
    if (typeof attribute.value !== "string") continue;

    if (name === "href" && !isApprovedHref(attribute.value)) {
      policyError(node, `URL attribute ${attribute.name} must use an internal path, approved https URL, or trusted mailto`);
    }
    if ((name === "action" || name === "formaction") && !isInternalHref(attribute.value)) {
      policyError(node, `form attribute ${attribute.name} must use an internal path`);
    }
    if ((name === "src" || name === "poster") && !localPublicImagePath.safeParse(attribute.value).success) {
      policyError(node, `asset attribute ${attribute.name} must use a local public image path`);
    }
  }

  const rel = staticAttributes.get("rel")?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  if (rel.includes("opener")) {
    policyError(node, "rel=opener is prohibited");
  }
  if (staticAttributes.get("target")?.toLowerCase() === "_blank" && !rel.includes("noopener")) {
    policyError(node, "target=_blank requires rel=noopener");
  }
}

function validateNode(node: MdxNode) {
  if (prohibitedNodeTypes.has(node.type)) {
    policyError(node, `${node.type} is prohibited`);
  }
  if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
    validateElement(node);
  }
  if ((node.type === "link" || node.type === "definition") && node.url && !isApprovedHref(node.url)) {
    policyError(node, "links must use an internal path, approved https URL, or trusted mailto");
  }
  if (node.type === "imageReference") {
    policyError(node, "reference-style images are prohibited; use an explicit local image path");
  }
  if (node.type === "image" && node.url && !localPublicImagePath.safeParse(node.url).success) {
    policyError(node, "images must use a local public image path");
  }
  node.children?.forEach(validateNode);
}

export function trustedMdxPolicy() {
  return (tree: MdxNode) => validateNode(tree);
}
