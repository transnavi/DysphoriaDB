import type { RequestHandler } from "./$types";
import { updateReaction } from "$lib/server/reactions";

export const POST: RequestHandler = ({ request, params, platform }) =>
  updateReaction(request, platform?.env, params.slug);
