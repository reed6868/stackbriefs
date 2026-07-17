import { z } from "astro/zod";

export const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const identifier = z
  .string()
  .trim()
  .min(1, "must not be empty")
  .regex(idPattern, "must use lowercase kebab-case");

export const nonEmptyText = z.string().trim().min(1, "must not be empty");

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day));

    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month! - 1 &&
      parsed.getUTCDate() === day
    );
  }, "must be a valid ISO calendar date (YYYY-MM-DD)");

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const httpsUrl = z
  .url("must be a valid URL")
  .refine((value) => parseUrl(value)?.protocol === "https:", "must use https")
  .refine((value) => {
    const url = parseUrl(value);
    return !url || (url.username === "" && url.password === "");
  }, "must not include URL credentials");

export const localPublicImagePath = z
  .string()
  .trim()
  .refine((value) => {
    if (!/^\/(?!\/)[A-Za-z0-9._/-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value)) return false;
    return value.split("/").every((segment) => segment !== "." && segment !== "..");
  }, "must use a local public asset image path");

export const uniqueStrings = <T extends z.ZodType<string>>(item: T, message: string) =>
  z.array(item).refine((values) => new Set(values).size === values.length, message);

function uniqueCanonicalValues(values: ReadonlyArray<{ value: string | number }>) {
  return new Set(values.map(({ value }) => value)).size === values.length;
}

export const canonicalStringValues = z
  .array(z.object({ value: identifier, label: nonEmptyText }).strict())
  .min(1)
  .refine(uniqueCanonicalValues, "allowedValues must use unique canonical values");

export const canonicalNumberValues = z
  .array(z.object({ value: z.number(), label: nonEmptyText }).strict())
  .min(1)
  .refine(uniqueCanonicalValues, "allowedValues must use unique canonical values");
