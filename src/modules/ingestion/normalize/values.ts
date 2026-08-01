import type { TransactionType } from "@/modules/listings/constants";
import { transactionTypes } from "@/modules/listings/constants";
import { formatDecimal } from "@/shared/utils/decimal";

export interface NormalizedScalarResult<T> {
  readonly value: T | null;
  readonly warning: string | null;
}

export interface NormalizedFloorResult {
  readonly floor: number | null;
  readonly floorCount: number | null;
  readonly warning: string | null;
}

const polishNumberWords: Readonly<Record<string, number>> = {
  jeden: 1,
  jedna: 1,
  dwa: 2,
  dwie: 2,
  trzy: 3,
  cztery: 4,
  piec: 5,
  pieciu: 5,
  szesc: 6,
};

const polishMonthMap: Readonly<Record<string, number>> = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  wrzesnia: 8,
  pazdziernika: 9,
  listopada: 10,
  grudnia: 11,
};

function normalizePolishText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .trim();
}

function cleanNumericInput(input: string): string {
  const normalized = normalizePolishText(input)
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  const match = normalized.match(/\d+(?:\.\d+)?/);

  return match?.[0] ?? "";
}

export function normalizePolishDecimalValue(
  input: string | number | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0) {
      return {
        value: null,
        warning: "INVALID_DECIMAL",
      };
    }

    return {
      value: formatDecimal(input, Number.isInteger(input) ? 0 : 2).replace(/\.00$/, ""),
      warning: null,
    };
  }

  const cleaned = cleanNumericInput(input);

  if (cleaned.length === 0) {
    return {
      value: null,
      warning: "INVALID_DECIMAL",
    };
  }

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      value: null,
      warning: "INVALID_DECIMAL",
    };
  }

  return {
    value: cleaned.includes(".") ? cleaned.replace(/0+$/, "").replace(/\.$/, "") : cleaned,
    warning: null,
  };
}

export function normalizePlnPrice(
  input: string | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const normalized = normalizePolishText(input);

  if (!normalized.includes("zl") && !normalized.includes("pln")) {
    return {
      value: null,
      warning: "NON_PLN_PRICE",
    };
  }

  const multiplier = normalized.includes("mln")
    ? 1_000_000
    : normalized.includes("tys")
      ? 1_000
      : 1;
  const decimalResult = normalizePolishDecimalValue(normalized);

  if (decimalResult.value === null) {
    return decimalResult;
  }

  const amount = Number(decimalResult.value) * multiplier;

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      value: null,
      warning: "INVALID_PRICE",
    };
  }

  return {
    value: formatDecimal(amount),
    warning: null,
  };
}

export function normalizeApartmentArea(
  input: string | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const decimalResult = normalizePolishDecimalValue(input);

  if (decimalResult.value === null) {
    return decimalResult;
  }

  const area = Number(decimalResult.value);

  if (!Number.isFinite(area) || area <= 0) {
    return {
      value: null,
      warning: "INVALID_AREA",
    };
  }

  return {
    value: formatDecimal(area, 2).replace(/0$/, "").replace(/\.$/, ""),
    warning: null,
  };
}

export function normalizeRoomCount(
  input: string | number | null | undefined,
): NormalizedScalarResult<number> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  if (typeof input === "number") {
    return input > 0
      ? { value: Math.trunc(input), warning: null }
      : { value: null, warning: "INVALID_ROOM_COUNT" };
  }

  const normalized = normalizePolishText(input);
  const digitMatch = normalized.match(/\d+/);

  if (digitMatch !== null) {
    const parsed = Number(digitMatch[0]);

    return parsed > 0
      ? { value: parsed, warning: null }
      : { value: null, warning: "INVALID_ROOM_COUNT" };
  }

  const word = normalized.split(/\s+/)[0];
  const mappedValue = polishNumberWords[word ?? ""];

  return mappedValue === undefined
    ? { value: null, warning: "UNRELIABLE_ROOM_COUNT" }
    : { value: mappedValue, warning: null };
}

export function normalizeFloorInfo(
  input: string | null | undefined,
): NormalizedFloorResult {
  if (input === null || input === undefined) {
    return {
      floor: null,
      floorCount: null,
      warning: null,
    };
  }

  const normalized = normalizePolishText(input);

  if (normalized === "parter") {
    return {
      floor: 0,
      floorCount: null,
      warning: null,
    };
  }

  const slashMatch = normalized.match(/(\d+)\s*\/\s*(\d+)/);

  if (slashMatch !== null) {
    return {
      floor: Number(slashMatch[1]),
      floorCount: Number(slashMatch[2]),
      warning: null,
    };
  }

  const phraseMatch = normalized.match(/(\d+)[^\d]+z[^\d]+(\d+)/);

  if (phraseMatch !== null) {
    return {
      floor: Number(phraseMatch[1]),
      floorCount: Number(phraseMatch[2]),
      warning: null,
    };
  }

  const floorOnlyMatch = normalized.match(/\d+/);

  if (floorOnlyMatch !== null) {
    return {
      floor: Number(floorOnlyMatch[0]),
      floorCount: null,
      warning: null,
    };
  }

  return {
    floor: null,
    floorCount: null,
    warning: "INVALID_FLOOR",
  };
}

export function normalizeTransactionType(
  input: string | null | undefined,
): NormalizedScalarResult<TransactionType> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const normalized = normalizePolishText(input);

  if (
    normalized.includes("sprzed") ||
    normalized.includes("sale") ||
    normalized.includes("kup")
  ) {
    return {
      value: transactionTypes[0],
      warning: null,
    };
  }

  if (
    normalized.includes("wynaj") ||
    normalized.includes("najem") ||
    normalized.includes("rent")
  ) {
    return {
      value: transactionTypes[1],
      warning: null,
    };
  }

  return {
    value: null,
    warning: "UNKNOWN_TRANSACTION_TYPE",
  };
}

export function normalizeCityName(
  input: string | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const normalized = normalizePolishText(input);
  const cityMap: Readonly<Record<string, string>> = {
    krakow: "Kraków",
    "krakow,malopolskie": "Kraków",
    warszawa: "Warszawa",
    wroclaw: "Wrocław",
    gdansk: "Gdańsk",
  };

  for (const [key, value] of Object.entries(cityMap)) {
    if (normalized.includes(key)) {
      return {
        value,
        warning: null,
      };
    }
  }

  const capitalized = input.trim();

  return capitalized.length === 0
    ? { value: null, warning: "MISSING_CITY" }
    : { value: capitalized, warning: "UNRECOGNIZED_CITY" };
}

export function extractDistrictFromLocationText(
  input: string | null | undefined,
  city: string | null,
): string | null {
  if (input === null || input === undefined || city === null) {
    return null;
  }

  const cleaned = input.replace(/zobacz na mapie\s*$/i, "").trim();
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const normalizedCity = normalizePolishText(city);
  const cityIndex = parts.findIndex((part) => normalizePolishText(part).includes(normalizedCity));

  if (cityIndex === -1) {
    return null;
  }

  const district = parts[cityIndex + 1];

  return district !== undefined && district.length > 0 ? district : null;
}

export function normalizeDate(
  input: string | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const trimmed = input.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      value: `${trimmed}T00:00:00.000Z`,
      warning: null,
    };
  }

  const dottedMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (dottedMatch !== null) {
    const day = Number(dottedMatch[1]);
    const month = Number(dottedMatch[2]) - 1;
    const year = Number(dottedMatch[3]);

    return {
      value: new Date(Date.UTC(year, month, day, 0, 0, 0)).toISOString(),
      warning: null,
    };
  }

  const polishMatch = normalizePolishText(trimmed).match(
    /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/,
  );

  if (polishMatch !== null) {
    const day = Number(polishMatch[1]);
    const month = polishMonthMap[polishMatch[2] ?? ""];
    const year = Number(polishMatch[3]);

    if (month !== undefined) {
      return {
        value: new Date(Date.UTC(year, month, day, 0, 0, 0)).toISOString(),
        warning: null,
      };
    }
  }

  return {
    value: null,
    warning: "UNPARSEABLE_DATE",
  };
}

export function normalizePhoneNumber(
  input: string | null | undefined,
): NormalizedScalarResult<string> {
  if (input === null || input === undefined) {
    return {
      value: null,
      warning: null,
    };
  }

  const digits = input.replace(/\D/g, "");

  if (digits.length === 9) {
    return {
      value: `+48${digits}`,
      warning: null,
    };
  }

  if (digits.length === 11 && digits.startsWith("48")) {
    return {
      value: `+${digits}`,
      warning: null,
    };
  }

  return {
    value: null,
    warning: "UNRELIABLE_PHONE",
  };
}
