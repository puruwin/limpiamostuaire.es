import { SITE_ENV } from "astro:env/server";

export { SITE_ENV };

/** Solo producción real es indexable; staging, provisional y local llevan noindex. */
export const isIndexable = SITE_ENV === "production";
