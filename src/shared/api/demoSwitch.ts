import { useEffect, useState } from "react";
import { API_URL } from "./client";
import { API_ENDPOINTS } from "./endpoints";

// A slow API counts as "off": nobody waits half a minute for a demo link.
const TIMEOUT_MS = 5000;

let request: Promise<boolean> | undefined;
let answer: boolean | undefined;

/**
 * Whether the demo access is on (GET /demo, anonymous), asked once per page load. Plain fetch instead of
 * apiClient: a failure here must stay silent (no error toast, no sign-out) and simply means "off".
 */
const fetchDemoEnabled = (): Promise<boolean> =>
  (request ??= fetch(`${API_URL}${API_ENDPOINTS.DEMO}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => body?.data?.enabled === true, () => false)
    .then((enabled) => (answer = enabled)));

/** `undefined` until the API answers; then the switch, which stays as it was read until the page reloads. */
export const useDemoEnabled = (): boolean | undefined => {
  const [enabled, setEnabled] = useState(answer);
  useEffect(() => {
    let alive = true;
    fetchDemoEnabled().then((value) => { if (alive) setEnabled(value); });
    return () => { alive = false; };
  }, []);
  return enabled;
};
