/**
 * Axiom logging client.
 *
 * Sends structured logs to the "lagna" dataset.
 * Configired via AXIOM_TOKEN environment variable.
 * Uses dynamic import so the build doesn't fail if the package is unavailable.
 */

type AxiomClient = {
  ingest: (dataset: string, data: Record<string, unknown>) => void;
  flush: () => void;
};

let client: AxiomClient | null = null;
let initializing = false;

async function getClient(): Promise<AxiomClient | null> {
  if (client) return client;
  if (initializing) return null;

  const token = process.env.AXIOM_TOKEN;
  if (!token) {
    console.debug("[Logger] AXIOM_TOKEN not set — logs will not be sent to Axiom");
    client = null;
    return null;
  }

  initializing = true;
  try {
    const { Axiom } = await import("@axiomhq/js");
    const ax = new Axiom({ token });
    client = ax;
    return client;
  } catch (err) {
    console.debug("[Logger] Failed to initialize Axiom client:", err);
    client = null;
    return null;
  } finally {
    initializing = false;
  }
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
  environment?: string;
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
  try {
    const ax = await getClient();
    if (!ax) return;
    await ax.ingest("lagna", { ...baseEvent("request"), method, path, status, duration, ...extras });
    await ax.flush();
  } catch {}
}

export async function logChartComputation(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  duration: number,
  extras?: Partial<LogEvent>
): Promise<void> {
  try {
    const ax = await getClient();
    if (!ax) return;
    await ax.ingest("lagna", { ...baseEvent("chart"), birthDate, birthTime, latitude, longitude, duration, ...extras });
    await ax.flush();
  } catch {}
}

export async function logAIInteraction(
  provider: string,
  mode: string,
  duration: number,
  success: boolean,
  extras?: Partial<LogEvent>
): Promise<void> {
  try {
    const ax = await getClient();
    if (!ax) return;
    await ax.ingest("lagna", { ...baseEvent("ai"), aiProvider: provider, aiMode: mode, duration, success, ...extras });
    await ax.flush();
  } catch {}
}

export async function logError(
  message: string,
  error?: unknown,
  extras?: Partial<LogEvent>
): Promise<void> {
  try {
    const ax = await getClient();
    if (!ax) return;
    await ax.ingest("lagna", { ...baseEvent("error"), message, error: error instanceof Error ? error.message : String(error), ...extras });
    await ax.flush();
  } catch {}
}

export async function logCustomEvent(
  event: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const ax = await getClient();
    if (!ax) return;
    await ax.ingest("lagna", { ...baseEvent("event"), event, ...data });
    await ax.flush();
  } catch {}
}
