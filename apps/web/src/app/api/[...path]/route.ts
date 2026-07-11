/**
 * API proxy — forwards /api/* requests to the Hono backend.
 *
 * Tries, in order:
 *   1. API_URL env var (set manually in Vercel dashboard — most reliable)
 *   2. VERCEL_RELATED_PROJECTS (auto-injected by Vercel Related Projects)
 *   3. localhost:3001 (local dev)
 */

export const runtime = "edge";

function getApiUrl(): string {
  // 1. Manual env var (most reliable, always works)
  if (process.env.API_URL) return process.env.API_URL;

  // 2. Vercel Related Projects
  try {
    const raw = process.env.VERCEL_RELATED_PROJECTS;
    if (raw) {
      const projects = JSON.parse(raw);
      // Try both project ID and project name as key
      const apiProject = projects["prj_9rFRuW6H7TcXE59dTn8t6zg1ZgZy"] || projects["graha-api"];
      if (apiProject?.urls?.production) {
        return `https://${apiProject.urls.production}`;
      }
    }
  } catch {}

  // 3. Local dev
  return "http://localhost:3001";
}

const TARGET = getApiUrl();
const API_SECRET = proc**************CRET;

export async function GET(request: Request) {
  return proxy(request);
}
export async function POST(request: Request) {
  return proxy(request);
}
export async function PUT(request: Request) {
  return proxy(request);
}
export async function DELETE(request: Request) {
  return proxy(request);
}

async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `${TARGET}${url.pathname}${url.search}`;

  try {
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

    const headers = new Headers(request.headers);
    if (API_SECRET) {
      headers.set("X-Graha-Secret", API_SECRET);
    }

    return await fetch(target, {
      method: request.method,
      headers,
      body,
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "API unreachable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
