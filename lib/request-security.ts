import crypto from "crypto";
import type { NextRequest } from "next/server";

function trustedProxyAddress(req: NextRequest) {
  const header = process.env.TRUSTED_PROXY_IP_HEADER?.trim().toLowerCase();
  if (!header) return null;
  const value = req.headers.get(header);
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

export function requestFingerprint(req: NextRequest, identifier?: string) {
  const address = trustedProxyAddress(req) ?? "direct";
  const agent = req.headers.get("user-agent")?.slice(0, 300) ?? "unknown";
  const language = req.headers.get("accept-language")?.slice(0, 100) ?? "";
  return crypto
    .createHash("sha256")
    .update(`${address}:${agent}:${language}:${identifier?.trim().toLowerCase() ?? ""}`)
    .digest("hex");
}

