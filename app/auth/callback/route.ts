import type { NextRequest } from "next/server";

import { createCallbackResponse } from "@/lib/authentik-oidc";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return createCallbackResponse(request);
}
