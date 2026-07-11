/**
 * Axiom logging client.
 *
 * Sends structured logs to the "lagna" dataset.
 * Configured via AXIOM_TOKEN environment variable.
 * Gracefully degrades when the token is not set (no logs sent).
 */
import { Axiom } from "@axiomhq/js";

let client: Axiom | null = null;

function getClient(): Axiom | null {
  if (client) return client;
  const token = process.env.AXIOM_TOKEN;
  if (!token) {
    console.debug("[Logger] AXIOM_TOKEN not set — logs will not be sent to Axiom");
    return null;
  }
  client = new Axiom({
    token,
    orgId: undefined, // inferred from token
  });
  return client;
}

export type LogEvent = {
  type: "request" | "chart" | "ai" | "error" | "event";
  timestamp: string;
  duration?: number;
  method?: string;
  path?: string;
  status?: number;
  message?: string;
  error?: string;
  userId?: string;
  chartId?: string;
  aiProvider?: string;
  aiMode?: string;
  requestBody?: Record<string, unknown>;
  [key: string]: unknown;
};

function baseEvent(type: LogEvent["type"]): LogEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };
}

export async function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  extras?: Partial<LogEvent>
): Promise<void> {
  const ax = getClient();
  if (!ax) return;
  try {
    await ax.ingest("lagna", {
      ...baseEvent("request"),
      method,
      path,
      status,
      duration,
      ...extras,
    });
    await ax.flush();
  } catch (err) {
    console.debug("[Logger] Failed to send request log:", err);
  }
}

export async function logChartComputation(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  duration: number,
  extras?: Partial<LogEvent>
): Promise<void> {
  const ax = getClient();
  if (!ax) return;
  try {
    await ax.ingest("lagna", {
      ...baseEvent("chart"),
      birthDate,
      birthTime,
      latitude,
      longitude,
      duration,
      ...extras,
    });
    await ax.flush();
  } catch (err) {
    console.debug("[Logger] Failed to send chart log:", err);
  }
}

export async function logAIInteraction(
  provider: string,
  mode: string,
  duration: number,
  success: boolean,
  extras?: Partial<LogEvent>
): Promise<void> {
  const ax = getClient();
  if (!ax) return;
  try {
    await ax.ingest("lagna", {
      ...baseEvent("ai"),
      aiProvider: provider,
      aiMode: mode,
      duration,
      success,
      ...extras,
    });
    await ax.flush();
  } catch (err) {
    console.debug("[Logger] Failed to send AI log:", err);
  }
}

export async function logError(
  message: string,
  error?: unknown,
  extras?: Partial<LogEvent>
): Promise<void> {
  const ax = getClient();
  if (!ax) return;
  try {
    await ax.ingest("lagna", {
      ...baseEvent("error"),
      message,
      error: error instanceof Error ? error.message : String(error),
      ...extras,
    });
    await ax.flush();
  } catch (err) {
    console.debug("[Logger] Failed to send error log:", err);
  }
}

export async function logCustomEvent(
  event: string,
  data?: Record<string, unknown>
): Promise<void> {
  const ax = getClient();
  if (!ax) return;
  try {
    await ax.ingest("lagna", {
      ...baseEvent("event"),
      event,
      ...data,
    });
    await ax.flush();
  } catch (err) {
    console.debug("[Logger] Failed to send event log:", err);
  }
}
