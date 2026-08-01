function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
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

  return deduplicated.length === 0 ? null : deduplicated;
}
