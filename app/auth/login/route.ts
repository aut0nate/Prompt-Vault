import type { NextRequest } from "next/server";

import { buildLoginUrl, createLoginResponse } from "@/lib/authentik-oidc";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    return await createLoginResponse(request);
  } catch {
    return Response.redirect(buildLoginUrl(request, "missing_config"));
  }
}
