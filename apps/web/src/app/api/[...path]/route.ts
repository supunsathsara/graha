/**
 * API proxy — forwards /api/* requests to the Hono backend.
 *
 * Uses Vercel's Related Projects feature to automatically discover
 * the API URL. Falls back to API_URL env var, then localhost for dev.
 *
 * Adds X-Graha-Secret header server-side (hidden from browser).
 */

export const runtime = "edge";

function getApiUrl(): string {
  // 1. Vercel Related Projects (auto-injected for preview/production)
  try {
    const raw = process.env.VERCEL_RELATED_PROJECTS;
    if (raw) {
      const projects = JSON.parse(raw);
      const apiProject = projects["prj_9rFRuW6H7TcXE59dTn8t6zg1ZgZy"];
      if (apiProject?.urls?.production) {
        return `https://${apiProject.urls.production}`;
      }
    }
  } catch {}

  // 2. Manual env var
  if (process.env.API_URL) return process.env.API_URL;

  // 3. Local dev
  return "http://localhost:3001";
}

const TARGET = getApiUrl();
const API_SECRET = process.env.API_SECRET;

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

    // Add API secret header server-side (hidden from browser)
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
