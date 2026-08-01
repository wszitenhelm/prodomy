import { z } from "zod";

export const listingIdSchema = z.string().trim().min(1);
