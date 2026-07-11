/**
 * API proxy route — forwards /api/* requests to the Hono backend.
 *
 * Runs on Vercel Edge Runtime (instant cold starts, globally distributed).
 * Adds the API_SECRET header server-side so the browser never sees it.
 *
 * In development:  proxies to http://localhost:3001 (local Hono server)
 * In production:   proxies to https://graha-api.vercel.app (separate project)
 */

export const runtime = "edge";

export async function GET(request: Request) {
  return proxyRequest(request);
}

export async function POST(request: Request) {
  return proxyRequest(request);
}

export async function PUT(request: Request) {
  return proxyRequest(request);
}

export async function DELETE(request: Request) {
  return proxyRequest(request);
}

async function proxyRequest(request: Request): Promise<Response> {
  const targetUrl = process.env.API_URL || "http://localhost:3001";
  const apiSecret = process.env.API_SECRET;

  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;
  const target = `${targetUrl}${path}${search}`;

  // Forward headers — add the secret server-side
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("Host", new URL(targetUrl).host);
  if (apiSecret) {
    forwardedHeaders.set("X-Graha-Secret", apiSecret);
  }

  try {
    // Read body for non-GET requests (arrayBuffer works in Edge Runtime)
    let body: ArrayBuffer | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

    const response = await fetch(target, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });

    // Forward the response headers (filtering out hop-by-hop headers)
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const hopByHop = ["transfer-encoding", "connection", "keep-alive",
                        "proxy-authenticate", "proxy-authorization",
                        "te", "trailer", "upgrade"];
      if (!hopByHop.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API Proxy] Backend unreachable:", error);
    return new Response(
      JSON.stringify({ success: false, error: "API backend unreachable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
