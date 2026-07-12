export type ActionResult = { ok: true } | { ok: false; error: string };

export function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}
