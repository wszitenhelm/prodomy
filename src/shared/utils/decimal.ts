import { z } from "zod";

export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Expected a decimal string with up to 2 decimal places.");

export function formatDecimal(value: number, fractionDigits: number = 2): string {
  return value.toFixed(fractionDigits);
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}
