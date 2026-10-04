import { z } from "zod";

/** Embedded OpenNGC / catalog object id — not a DB FK. */
export const CatalogIdSchema = z.string().min(1);

export type CatalogId = z.infer<typeof CatalogIdSchema>;
