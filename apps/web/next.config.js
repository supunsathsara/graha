/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // In development, proxy /api/* requests to the Hono backend
  // In production (Vercel), the root vercel.json handles this routing
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
