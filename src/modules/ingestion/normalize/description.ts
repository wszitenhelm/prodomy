function decodeHtmlEntities(input: string): string {
  return input
    // Some sources double-encode (e.g. "&amp;#39;" for an apostrophe), so
    // &amp; must unescape first or the numeric entity it reveals never gets
    // a second decoding pass.
    .replace(/&amp;/gi, "&")
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, "\"")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function removeTrailingReadMoreBoilerplate(input: string): string {
  return input.replace(/\s*Poka[żz]\s+cały\s+opis\s*$/iu, "");
}

function deduplicateParagraphs(input: string): string {
  const seen = new Set<string>();
  const paragraphs = input
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const uniqueParagraphs = paragraphs.filter((paragraph) => {
    if (seen.has(paragraph)) {
      return false;
    }

    seen.add(paragraph);
    return true;
  });

  return uniqueParagraphs.join("\n");
}

export function extractDescriptionRaw(input: string | null | undefined): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  const trimmed = input.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function cleanDescription(input: string | null | undefined): string | null {
  const raw = extractDescriptionRaw(input);

  if (raw === null) {
    return null;
  }

  const decoded = decodeHtmlEntities(raw);
  const stripped = stripHtml(decoded);
  const normalizedWhitespace = stripped
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([!?.,])\1{2,}/g, "$1$1")
    .trim();

  const deduplicated = deduplicateParagraphs(normalizedWhitespace);
  const withoutBoilerplate = removeTrailingReadMoreBoilerplate(deduplicated).trim();

  return withoutBoilerplate.length === 0 ? null : withoutBoilerplate;
}
