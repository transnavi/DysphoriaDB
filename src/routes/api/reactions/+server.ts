import type { RequestHandler } from "./$types";
import { getReactionCounts, jsonResponse } from "$lib/server/reactions";

export const GET: RequestHandler = async ({ platform }) => {
  try {
    return jsonResponse({ counts: await getReactionCounts(platform?.env) });
  } catch (cause) {
    console.error(JSON.stringify({
      message: "reaction_api_error",
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    return jsonResponse({ error: "Service unavailable" }, 503);
  }
};
