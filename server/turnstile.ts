// Comprobación del token de Cloudflare Turnstile en el servidor.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  ip: string | undefined,
  secret: string,
  fetchFn: typeof fetch,
): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetchFn(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      console.warn(
        `turnstile: rechazado (${(data["error-codes"] ?? []).join(", ") || response.status})`,
      );
    }
    return data.success === true;
  } catch (error) {
    console.error(`turnstile: sin respuesta de Cloudflare: ${String(error)}`);
    return false;
  }
}
