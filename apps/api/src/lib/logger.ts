/**
 * Axiom logging client using @axiomhq/logging with SimpleFetchTransport.
 *
 * Sends structured logs to the "lagna" dataset.
 * Configured via AXIOM_TOKEN environment variable.
 * Uses dynamic import so builds don't fail if the package is unavailable.
 */

const AXIOM_INGEST_URL = "https://api.axiom.co/v1/datasets/lagna/ingest";

let logger: any = null;

async function getLogger() {
  if (logger) return logger;

  const token = process.env.AXIOM_TOKEN;
  if (!token) {
    console.debug("[Logger] AXIOM_TOKEN not set — logs won't be sent to Axiom");
    return null;
  }

  try {
    const { Logger, LogLevel, SimpleFetchTransport } = await import("@axiomhq/logging");

    const transport = new SimpleFetchTransport({
      input: AXIOM_INGEST_URL,
      init: {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "graha/1.0",
        },
      },
    });

    logger = new Logger({
      transports: [transport],
      logLevel: LogLevel.info,
    });

    return logger;
  } catch (err) {
    console.debug("[Logger] Failed to initialize:", err);
    return null;
  }
}

export async function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  extras?: Record<string, any>
): Promise<void> {
  try {
    const log = await getLogger();
    if (!log) return;
    log.info(`[Request] ${method} ${path}`, { type: "request", method, path, status, duration, ...extras });
    await log.flush();
  } catch {}
}

export async function logChartComputation(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  duration: number,
  extras?: Record<string, any>
): Promise<void> {
  try {
    const log = await getLogger();
    if (!log) return;
    log.info("[Chart] Computation", { type: "chart", birthDate, birthTime, latitude, longitude, duration, ...extras });
    await log.flush();
  } catch {}
}

export async function logAIInteraction(
  provider: string,
  mode: string,
  duration: number,
  success: boolean,
  extras?: Record<string, any>
): Promise<void> {
  try {
    const log = await getLogger();
    if (!log) return;
    log.info("[AI] Interaction", { type: "ai", aiProvider: provider, aiMode: mode, duration, success, ...extras });
    await log.flush();
  } catch {}
}

export async function logError(
  message: string,
  error?: unknown,
  extras?: Record<string, any>
): Promise<void> {
  try {
    const log = await getLogger();
    if (!log) return;
    log.error(`[Error] ${message}`, {
      type: "error",
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...extras,
    });
    await log.flush();
  } catch {}
}
